from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    service_number = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    rank = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='User') # 'Admin' or 'User'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'service_number': self.service_number,
            'rank': self.rank,
            'name': self.name,
            'role': self.role
        }

class Duty(db.Model):
    __tablename__ = 'duties'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, unique=True, nullable=False) # Only one duty per date
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    user = db.relationship('User', backref=db.backref('duties', lazy=True, cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'user': self.user.to_dict() if self.user else None
        }

class Pass(db.Model):
    __tablename__ = 'passes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(200), nullable=True)
    
    user = db.relationship('User', backref=db.backref('passes', lazy=True, cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'reason': self.reason,
            'user': self.user.to_dict() if self.user else None
        }

class Leave(db.Model):
    __tablename__ = 'leaves'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    year = db.Column(db.String(4), nullable=False) # Format: YYYY
    start_date = db.Column(db.String(10), nullable=False) # Format: YYYY-MM-DD
    end_date = db.Column(db.String(10), nullable=False) # Format: YYYY-MM-DD
    note = db.Column(db.String(200), nullable=True)
    
    user = db.relationship('User', backref=db.backref('leaves', lazy=True, cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'year': self.year,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'note': self.note,
            'user': self.user.to_dict() if self.user else None
        }
