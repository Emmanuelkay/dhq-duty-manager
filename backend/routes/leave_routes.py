from flask import Blueprint, request, jsonify, session
from models import db, Leave, User
from middleware import role_required
from utils import validate_input

leave_bp = Blueprint('leave_bp', __name__)

@leave_bp.route('/', methods=['GET'])
@role_required(['admin', 'duty_officer', 'viewer'])
def get_leaves():
    year_filter = request.args.get('year')
    month_filter = request.args.get('month')
    query = Leave.query
    if year_filter:
        query = query.filter(Leave.year == year_filter)
    if month_filter:
        query = query.filter(Leave.month == month_filter)
        
    leaves = query.all()
    return jsonify([l.to_dict() for l in leaves]), 200

@leave_bp.route('/', methods=['POST'])
@role_required(['admin', 'duty_officer'])
def create_leave():
        
    data = request.get_json()
    schema = {
        'user_id': {'type': 'int', 'required': True},
        'year': {'type': 'string', 'required': True},
        'month': {'type': 'string'},
        'start_date': {'type': 'date', 'required': True},
        'end_date': {'type': 'date', 'required': True},
        'note': {'type': 'string'}
    }
    errors = validate_input(data, schema)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400
        
    user_id = data.get('user_id')
    year = data.get('year')
    month = data.get('month')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    note = data.get('note', '')
    
    if not user_id or not year or not start_date or not end_date:
        return jsonify({"error": "Missing required fields"}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    new_leave = Leave(user_id=user_id, year=year, month=month, start_date=start_date, end_date=end_date, note=note)
    db.session.add(new_leave)
    db.session.commit()
    
    return jsonify(new_leave.to_dict()), 201

@leave_bp.route('/<int:leave_id>', methods=['DELETE'])
@role_required('admin')
def delete_leave(leave_id):
        
    leave_record = Leave.query.get(leave_id)
    if not leave_record:
        return jsonify({"error": "Leave record not found"}), 404
        
    db.session.delete(leave_record)
    db.session.commit()
    return jsonify({"message": "Leave removed successfully"}), 200
