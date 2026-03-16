from app import create_app
from models import db, User

def init_db():
    app = create_app()
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if admin exists
        admin = User.query.filter_by(service_number='admin').first()
        if not admin:
            print("Creating default admin user...")
            new_admin = User(
                service_number='admin',
                rank='System Admin',
                name='Administrator',
                role='Admin'
            )
            new_admin.set_password('admin123')
            db.session.add(new_admin)
            db.session.commit()
            print("Default admin created (service_number: admin, password: admin123)")
        else:
            print("Admin user already exists.")

if __name__ == '__main__':
    init_db()
