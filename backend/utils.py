import re
from flask import jsonify

def validate_input(data, schema):
    """
    Validates input data against a schema.
    schema format: { field_name: { 'type': 'string', 'pattern': r'...', 'required': True } }
    """
    errors = []
    for field, rules in schema.items():
        val = data.get(field)
        
        if rules.get('required') and val is None:
            errors.append(f"{field} is required.")
            continue
            
        if val is not None:
            if rules.get('type') == 'string':
                if not isinstance(val, str):
                    errors.append(f"{field} must be a string.")
                elif rules.get('pattern') and not re.match(rules['pattern'], val):
                    errors.append(f"{field} contains invalid characters.")
                    
            if rules.get('type') == 'int' and not isinstance(val, int):
                errors.append(f"{field} must be an integer.")
                
            if rules.get('type') == 'date' and val:
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', val):
                    errors.append(f"{field} must be in YYYY-MM-DD format.")
                    
    return errors

# Common patterns
ALPHANUMERIC = r'^[a-zA-Z0-9]+$'
NAME_PATTERN = r'^[a-zA-Z0-9\s\.\-]+$'
SERVICE_ID_PATTERN = r'^[a-zA-Z0-9\-\/]+$'
