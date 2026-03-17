from flask import Blueprint, request, jsonify, session
from models import db, Leave, User

leave_bp = Blueprint('leave_bp', __name__)

def is_admin():
    return session.get('role') == 'Admin'

@leave_bp.route('/', methods=['GET'])
def get_leaves():
    year_filter = request.args.get('year')
    query = Leave.query
    if year_filter:
        query = query.filter(Leave.year == year_filter)
        
    leaves = query.all()
    return jsonify([l.to_dict() for l in leaves]), 200

@leave_bp.route('/', methods=['POST'])
def create_leave():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.get_json()
    user_id = data.get('user_id')
    year = data.get('year')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    note = data.get('note', '')
    
    if not user_id or not year or not start_date or not end_date:
        return jsonify({"error": "Missing required fields"}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    new_leave = Leave(user_id=user_id, year=year, start_date=start_date, end_date=end_date, note=note)
    db.session.add(new_leave)
    db.session.commit()
    
    return jsonify(new_leave.to_dict()), 201

@leave_bp.route('/<int:leave_id>', methods=['DELETE'])
def delete_leave(leave_id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
        
    leave_record = Leave.query.get(leave_id)
    if not leave_record:
        return jsonify({"error": "Leave record not found"}), 404
        
    db.session.delete(leave_record)
    db.session.commit()
    return jsonify({"message": "Leave removed successfully"}), 200
