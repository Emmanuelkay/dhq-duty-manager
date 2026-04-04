from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
from models import db, Duty, User
from sqlalchemy.exc import IntegrityError
from middleware import role_required
from utils import validate_input

duty_bp = Blueprint('duty_bp', __name__)

@duty_bp.route('/', methods=['GET'])
@role_required(['admin', 'duty_officer', 'viewer'])
def get_duties():
    duties = Duty.query.all()
    return jsonify([duty.to_dict() for duty in duties]), 200

@duty_bp.route('/', methods=['POST'])
@role_required('admin')
def assign_duty():
        
    data = request.get_json()
    schema = {
        'date': {'type': 'date', 'required': True},
        'user_id': {'type': 'int', 'required': True}
    }
    errors = validate_input(data, schema)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    date_str = data.get('date')
    user_id = data.get('user_id')
    
    if not date_str or not user_id:
        return jsonify({"error": "Missing date or user_id"}), 400
        
    try:
        duty_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    new_duty = Duty(date=duty_date, user_id=user_id)
    db.session.add(new_duty)
    
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A duty is already assigned for this date"}), 400
        
    return jsonify(new_duty.to_dict()), 201

@duty_bp.route('/<int:duty_id>', methods=['PUT', 'DELETE'])
@role_required('admin')
def update_or_remove_duty(duty_id):
        
    duty = Duty.query.get(duty_id)
    if not duty:
        return jsonify({"error": "Duty not found"}), 404

    # Enforce Lockdown: if the duty date has passed (strictly earlier than yesterday)
    # This provides a 24h grace period for last-minute corrections
    yesterday = (datetime.today() - timedelta(days=1)).date()
    if duty.date < yesterday:
        return jsonify({"error": "Cannot modify or delete a duty that has already passed more than 24 hours ago"}), 400

    if request.method == 'DELETE':
        db.session.delete(duty)
        db.session.commit()
        return jsonify({"message": "Duty removed successfully"}), 200

    if request.method == 'PUT':
        data = request.get_json()
        schema = {
            'date': {'type': 'date'},
            'user_id': {'type': 'int'}
        }
        errors = validate_input(data, schema)
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400
            
        new_user_id = data.get('user_id')
        new_date_str = data.get('date')
        
        if new_date_str:
            try:
                new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
                duty.date = new_date
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
                
        if new_user_id:
            user = User.query.get(new_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            duty.user_id = new_user_id
            
        try:
            db.session.commit()
            return jsonify(duty.to_dict()), 200
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "A duty is already assigned for the requested date"}), 400
