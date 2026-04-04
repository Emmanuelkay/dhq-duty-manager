from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from routes.auth_routes import auth_bp
from routes.personnel_routes import personnel_bp
from routes.duty_routes import duty_bp
from routes.pass_routes import pass_bp
from routes.leave_routes import leave_bp

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import timedelta, datetime

def create_app():
    app = Flask(__name__)
    
    # 1. Transport Security & CORS
    CORS(app, supports_credentials=True)
    
    # 2. Hardened Session Management
    app.config['SECRET_KEY'] = 'dev_secret_key_change_in_prod_12345!'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = True  # Enforce encrypted transport
    app.config['SESSION_COOKIE_SAMESITE'] = 'Strict' # Prevent CSRF
    
    # Session Expiry (30 min inactivity, 8h absolute)
    app.permanent_session_lifetime = timedelta(minutes=30)
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
    
    # 3. Brute Force & Rate Limiting (Priority 2)
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["100 per minute"],
        storage_uri="memory://",
    )
    app.limiter = limiter # Expose to blueprints

    # DB & Monitoring
    app.config['SECRET_KEY'] = 'dev_secret_key_change_in_prod'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///personnel.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize DB
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(personnel_bp, url_prefix='/api/users')
    app.register_blueprint(duty_bp, url_prefix='/api/duties')
    app.register_blueprint(pass_bp, url_prefix='/api/passes')
    app.register_blueprint(leave_bp, url_prefix='/api/leaves')
    
    @app.before_request
    def check_session_validity():
        from flask import request, session, jsonify, make_response
        
        # Mark session as permanent to enable lifetime tracking
        session.permanent = True
        
        if request.method == 'OPTIONS':
            return
            
        if request.endpoint and 'auth_bp' not in request.endpoint and 'health_check' not in request.endpoint:
            if not session.get('user_id'):
                return jsonify({"error": "Session expired or invalid. Please re-authenticate."}), 401
                
            # Absolute Session Timeout (8 hours)
            login_time = session.get('login_time')
            if login_time and (datetime.utcnow().timestamp() - login_time) > 28800: # 8 hours in seconds
                session.clear()
                return jsonify({"error": "Session absolute timeout reached (8h). Please login again."}), 401
                
            if session.get('requires_password_change'):
                return jsonify({"error": "Password change required.", "requires_password_change": True}), 403

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy"}), 200
        
    with app.app_context():
        db.create_all()
        from models import User
        if not User.query.filter_by(service_number='admin').first():
            admin_user = User(
                service_number='admin',
                name='Administrator',
                rank='System Admin',
                role='admin'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created.")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded", "details": str(e.description)}), 429

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(f"Server Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled Exception: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
