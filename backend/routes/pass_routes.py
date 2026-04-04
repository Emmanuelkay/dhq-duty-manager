from flask import Blueprint, request, jsonify, session
from datetime import datetime
from models import db, Pass, User
from middleware import role_required
from utils import validate_input

pass_bp = Blueprint('pass_bp', __name__)

@pass_bp.route('/', methods=['GET'])
@role_required(['admin', 'duty_officer', 'viewer'])
def get_passes():
    passes = Pass.query.all()
    return jsonify([p.to_dict() for p in passes]), 200

@pass_bp.route('/', methods=['POST'])
@role_required(['admin', 'duty_officer'])
def create_pass():
        
    data = request.get_json()
    schema = {
        'user_id': {'type': 'int', 'required': True},
        'start_date': {'type': 'date', 'required': True},
        'end_date': {'type': 'date', 'required': True},
        'reason': {'type': 'string'}
    }
    errors = validate_input(data, schema)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    user_id = data.get('user_id')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    reason = data.get('reason', '')
    
    if not user_id or not start_date_str or not end_date_str:
        return jsonify({"error": "Missing required fields"}), 400
        
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    new_pass = Pass(user_id=user_id, start_date=start_date, end_date=end_date, reason=reason)
    db.session.add(new_pass)
    db.session.commit()
    
    return jsonify(new_pass.to_dict()), 201

@pass_bp.route('/<int:pass_id>', methods=['DELETE'])
@role_required('admin')
def delete_pass(pass_id):
        
    p = Pass.query.get(pass_id)
    if not p:
        return jsonify({"error": "Pass not found"}), 404
        
    db.session.delete(p)
    db.session.commit()
    return jsonify({"message": "Pass removed successfully"}), 200
