from flask import Blueprint, request, jsonify, session
from models import db, User
from middleware import role_required
from utils import validate_input, SERVICE_ID_PATTERN, NAME_PATTERN

personnel_bp = Blueprint('personnel_bp', __name__)

@personnel_bp.route('/', methods=['GET'])
@role_required(['admin', 'duty_officer', 'viewer'])
def get_all_personnel():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@personnel_bp.route('/', methods=['POST'])
@role_required('admin')
def add_personnel():
        
    data = request.get_json()
    
    schema = {
        'service_number': {'type': 'string', 'pattern': SERVICE_ID_PATTERN, 'required': True},
        'name': {'type': 'string', 'pattern': NAME_PATTERN, 'required': True},
        'rank': {'type': 'string', 'pattern': NAME_PATTERN, 'required': True},
        'role': {'type': 'string', 'required': False}
    }
    
    errors = validate_input(data, schema)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    service_number = data.get('service_number')
    password = 'Changeme!'
    rank = data.get('rank')
    name = data.get('name')
    role = data.get('role', 'viewer')
    
    if not all([service_number, rank, name]):
        return jsonify({"error": "Missing required fields"}), 400
        
    if User.query.filter_by(service_number=service_number).first():
        return jsonify({"error": "Service Number already exists"}), 400
        
    new_user = User(service_number=service_number, rank=rank, name=name, role=role)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@personnel_bp.route('/<int:user_id>', methods=['PUT'])
@role_required('admin')
def edit_personnel(user_id):
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json()
    schema = {
        'service_number': {'type': 'string', 'pattern': SERVICE_ID_PATTERN},
        'name': {'type': 'string', 'pattern': NAME_PATTERN},
        'rank': {'type': 'string', 'pattern': NAME_PATTERN},
        'role': {'type': 'string'},
        'password': {'type': 'string'}
    }
    errors = validate_input(data, schema)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    if 'service_number' in data:
        user.service_number = data['service_number']
    if 'rank' in data:
        user.rank = data['rank']
    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        user.role = data['role']
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    db.session.commit()
    return jsonify(user.to_dict()), 200

@personnel_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_personnel(user_id):
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Prevent self-deletion if needed, but not strictly required
    if user.id == session.get('user_id'):
        return jsonify({"error": "Cannot delete your own account"}), 400
        
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
