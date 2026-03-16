from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from routes.auth_routes import auth_bp
from routes.personnel_routes import personnel_bp
from routes.duty_routes import duty_bp

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    
    # Configuration
    app.config['SECRET_KEY'] = 'dev_secret_key_change_in_prod'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///personnel.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize DB
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(personnel_bp, url_prefix='/api/users')
    app.register_blueprint(duty_bp, url_prefix='/api/duties')
    
    @app.before_request
    def check_password_change():
        from flask import request, session, jsonify
        if request.method == 'OPTIONS':
            return
        if request.endpoint and 'auth_bp' not in request.endpoint and 'health_check' not in request.endpoint:
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
                role='Admin'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created.")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
