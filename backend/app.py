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
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy"}), 200
        
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
