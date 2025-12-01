from flask import Flask, request, jsonify, session, make_response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import hashlib

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///food_delivery.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# CORS handling - must be before all routes
@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Id'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 200

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-User-Id'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Helper function to get user_id from header or session
def get_current_user_id():
    # First try header (for stateless auth)
    user_id = request.headers.get('X-User-Id')
    if user_id:
        return int(user_id)
    # Fallback to session
    return session.get('user_id')

# Simple password hashing using sha256
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hash_password(password) == hashed

# ==================== MODELS ====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    display_name = db.Column(db.String(100), default='User')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    restaurants = db.relationship('Restaurant', backref='owner', lazy=True)
    cart_items = db.relationship('CartItem', backref='user', lazy=True)
    orders = db.relationship('Order', backref='user', lazy=True)

class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    open_time = db.Column(db.String(10), nullable=False)  # Format: HH:MM
    close_time = db.Column(db.String(10), nullable=False)  # Format: HH:MM
    location = db.Column(db.String(200), nullable=False)
    pickup_time = db.Column(db.String(50), nullable=False)
    pickup_location = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500), default='')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_items = db.relationship('MenuItem', backref='restaurant', lazy=True, cascade='all, delete-orphan')

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(300), default='')
    image_url = db.Column(db.String(500), default='')
    is_available = db.Column(db.Boolean, default=True)

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    note = db.Column(db.String(200), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_item = db.relationship('MenuItem', backref='cart_items')
    restaurant = db.relationship('Restaurant', backref='cart_items')

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled
    pickup_time = db.Column(db.String(50))
    pickup_location = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    restaurant = db.relationship('Restaurant', backref='orders')

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)
    note = db.Column(db.String(200), default='')
    
    # Relationships
    menu_item = db.relationship('MenuItem', backref='order_items')

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')

# ==================== AUTH ENDPOINTS ====================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=username).first()
    
    if user and verify_password(password, user.password):
        session['user_id'] = user.id
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'display_name': user.display_name
            }
        }), 200
    
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    user_id = get_current_user_id()
    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'display_name': user.display_name
                }
            }), 200
    return jsonify({'authenticated': False}), 401

# ==================== RESTAURANT ENDPOINTS ====================

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    restaurants = Restaurant.query.filter_by(is_active=True).all()
    result = []
    for r in restaurants:
        owner = User.query.get(r.user_id)
        result.append({
            'id': r.id,
            'user_id': r.user_id,
            'owner_name': owner.display_name if owner else 'Unknown',
            'name': r.name,
            'open_time': r.open_time,
            'close_time': r.close_time,
            'location': r.location,
            'pickup_time': r.pickup_time,
            'pickup_location': r.pickup_location,
            'image_url': r.image_url,
            'menu_count': len(r.menu_items)
        })
    return jsonify(result), 200

@app.route('/api/restaurants/<int:restaurant_id>', methods=['GET'])
def get_restaurant(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    owner = User.query.get(restaurant.user_id)
    return jsonify({
        'id': restaurant.id,
        'user_id': restaurant.user_id,
        'owner_name': owner.display_name if owner else 'Unknown',
        'name': restaurant.name,
        'open_time': restaurant.open_time,
        'close_time': restaurant.close_time,
        'location': restaurant.location,
        'pickup_time': restaurant.pickup_time,
        'pickup_location': restaurant.pickup_location,
        'image_url': restaurant.image_url
    }), 200

@app.route('/api/restaurants', methods=['POST'])
def create_restaurant():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    
    restaurant = Restaurant(
        user_id=user_id,
        name=data.get('name'),
        open_time=data.get('open_time'),
        close_time=data.get('close_time'),
        location=data.get('location'),
        pickup_time=data.get('pickup_time'),
        pickup_location=data.get('pickup_location'),
        image_url=data.get('image_url', '')
    )
    
    db.session.add(restaurant)
    db.session.commit()
    
    return jsonify({
        'message': 'Restaurant created successfully',
        'id': restaurant.id
    }), 201

# ==================== MENU ENDPOINTS ====================

@app.route('/api/restaurants/<int:restaurant_id>/menu', methods=['GET'])
def get_menu(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    menu_items = MenuItem.query.filter_by(restaurant_id=restaurant_id, is_available=True).all()
    
    result = [{
        'id': item.id,
        'restaurant_id': item.restaurant_id,
        'name': item.name,
        'price': item.price,
        'description': item.description,
        'image_url': item.image_url
    } for item in menu_items]
    
    return jsonify({
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'pickup_time': restaurant.pickup_time,
            'pickup_location': restaurant.pickup_location
        },
        'menu': result
    }), 200

@app.route('/api/restaurants/<int:restaurant_id>/menu', methods=['POST'])
def add_menu_item(restaurant_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    if restaurant.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    menu_item = MenuItem(
        restaurant_id=restaurant_id,
        name=data.get('name'),
        price=data.get('price'),
        description=data.get('description', ''),
        image_url=data.get('image_url', '')
    )
    
    db.session.add(menu_item)
    db.session.commit()
    
    return jsonify({
        'message': 'Menu item added successfully',
        'id': menu_item.id
    }), 201

# ==================== CART ENDPOINTS ====================

@app.route('/api/cart', methods=['GET'])
def get_cart():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    
    # Group by restaurant
    restaurants = {}
    for item in cart_items:
        if item.restaurant_id not in restaurants:
            restaurants[item.restaurant_id] = {
                'restaurant': {
                    'id': item.restaurant.id,
                    'name': item.restaurant.name,
                    'pickup_time': item.restaurant.pickup_time,
                    'pickup_location': item.restaurant.pickup_location
                },
                'items': [],
                'subtotal': 0
            }
        
        item_data = {
            'id': item.id,
            'menu_item_id': item.menu_item_id,
            'name': item.menu_item.name,
            'price': item.menu_item.price,
            'quantity': item.quantity,
            'note': item.note,
            'total': item.menu_item.price * item.quantity
        }
        restaurants[item.restaurant_id]['items'].append(item_data)
        restaurants[item.restaurant_id]['subtotal'] += item_data['total']
    
    total = sum(r['subtotal'] for r in restaurants.values())
    
    return jsonify({
        'restaurants': list(restaurants.values()),
        'total': total,
        'item_count': len(cart_items)
    }), 200

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    menu_item_id = data.get('menu_item_id')
    quantity = data.get('quantity', 1)
    note = data.get('note', '')
    
    menu_item = MenuItem.query.get_or_404(menu_item_id)
    
    # Check if item already in cart
    existing = CartItem.query.filter_by(
        user_id=user_id,
        menu_item_id=menu_item_id
    ).first()
    
    if existing:
        existing.quantity += quantity
        existing.note = note if note else existing.note
    else:
        cart_item = CartItem(
            user_id=user_id,
            menu_item_id=menu_item_id,
            restaurant_id=menu_item.restaurant_id,
            quantity=quantity,
            note=note
        )
        db.session.add(cart_item)
    
    db.session.commit()
    
    return jsonify({'message': 'Added to cart'}), 200

@app.route('/api/cart/<int:item_id>', methods=['PUT'])
def update_cart_item(item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    cart_item = CartItem.query.get_or_404(item_id)
    if cart_item.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if 'quantity' in data:
        if data['quantity'] <= 0:
            db.session.delete(cart_item)
        else:
            cart_item.quantity = data['quantity']
    
    if 'note' in data:
        cart_item.note = data['note']
    
    db.session.commit()
    
    return jsonify({'message': 'Cart updated'}), 200

@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
def remove_from_cart(item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    cart_item = CartItem.query.get_or_404(item_id)
    if cart_item.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(cart_item)
    db.session.commit()
    
    return jsonify({'message': 'Item removed from cart'}), 200

@app.route('/api/cart/clear', methods=['DELETE'])
def clear_cart():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    
    return jsonify({'message': 'Cart cleared'}), 200

# ==================== ORDER ENDPOINTS ====================

@app.route('/api/orders', methods=['POST'])
def create_order():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Group by restaurant and create separate orders
    restaurant_items = {}
    for item in cart_items:
        if item.restaurant_id not in restaurant_items:
            restaurant_items[item.restaurant_id] = []
        restaurant_items[item.restaurant_id].append(item)
    
    created_orders = []
    
    for restaurant_id, items in restaurant_items.items():
        restaurant = Restaurant.query.get(restaurant_id)
        total_price = sum(item.menu_item.price * item.quantity for item in items)
        
        order = Order(
            user_id=user_id,
            restaurant_id=restaurant_id,
            total_price=total_price,
            pickup_time=restaurant.pickup_time,
            pickup_location=restaurant.pickup_location
        )
        db.session.add(order)
        db.session.flush()  # Get order.id
        
        for cart_item in items:
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=cart_item.menu_item_id,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price,
                note=cart_item.note
            )
            db.session.add(order_item)
        
        created_orders.append(order.id)
    
    # Clear cart
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    
    return jsonify({
        'message': 'Order placed successfully',
        'order_ids': created_orders
    }), 201

@app.route('/api/orders/history', methods=['GET'])
def get_order_history():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        items = [{
            'name': item.menu_item.name,
            'quantity': item.quantity,
            'price': item.price,
            'note': item.note
        } for item in order.order_items]
        
        result.append({
            'id': order.id,
            'restaurant_name': order.restaurant.name,
            'total_price': order.total_price,
            'status': order.status,
            'pickup_time': order.pickup_time,
            'pickup_location': order.pickup_location,
            'created_at': order.created_at.isoformat(),
            'items': items
        })
    
    return jsonify(result), 200

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Check if user is owner or orderer
    if order.user_id != user_id and order.restaurant.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    items = [{
        'name': item.menu_item.name,
        'quantity': item.quantity,
        'price': item.price,
        'note': item.note
    } for item in order.order_items]
    
    return jsonify({
        'id': order.id,
        'restaurant_name': order.restaurant.name,
        'restaurant_owner_id': order.restaurant.user_id,
        'customer_id': order.user_id,
        'total_price': order.total_price,
        'status': order.status,
        'pickup_time': order.pickup_time,
        'pickup_location': order.pickup_location,
        'created_at': order.created_at.isoformat(),
        'items': items
    }), 200

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Only restaurant owner can update status
    if order.restaurant.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['pending', 'confirmed', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    
    order.status = new_status
    db.session.commit()
    
    return jsonify({'message': 'Order status updated'}), 200

# ==================== MESSAGE ENDPOINTS ====================

@app.route('/api/messages/<int:order_id>', methods=['GET'])
def get_messages(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Check if user is part of this order
    if order.user_id != user_id and order.restaurant.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    messages = Message.query.filter_by(order_id=order_id).order_by(Message.created_at).all()
    
    # Mark messages as read
    for msg in messages:
        if msg.receiver_id == user_id and not msg.is_read:
            msg.is_read = True
    db.session.commit()
    
    result = [{
        'id': msg.id,
        'sender_id': msg.sender_id,
        'sender_name': msg.sender.display_name,
        'content': msg.content,
        'created_at': msg.created_at.isoformat(),
        'is_mine': msg.sender_id == user_id
    } for msg in messages]
    
    return jsonify(result), 200

@app.route('/api/messages/<int:order_id>', methods=['POST'])
def send_message(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Check if user is part of this order
    if order.user_id != user_id and order.restaurant.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Determine receiver
    if order.user_id == user_id:
        receiver_id = order.restaurant.user_id
    else:
        receiver_id = order.user_id
    
    data = request.get_json()
    content = data.get('content')
    
    if not content:
        return jsonify({'error': 'Message content is required'}), 400
    
    message = Message(
        sender_id=user_id,
        receiver_id=receiver_id,
        order_id=order_id,
        content=content
    )
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify({
        'message': 'Message sent',
        'id': message.id
    }), 201

# ==================== USER ENDPOINTS ====================

@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = User.query.get(user_id)
    
    # Get user's restaurants
    restaurants = [{
        'id': r.id,
        'name': r.name
    } for r in user.restaurants]
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'display_name': user.display_name,
        'restaurants': restaurants
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = User.query.get(user_id)
    data = request.get_json()
    
    if 'display_name' in data:
        user.display_name = data['display_name']
    
    db.session.commit()
    
    return jsonify({'message': 'Profile updated'}), 200

# ==================== DATABASE INITIALIZATION ====================

def init_db():
    with app.app_context():
        db.create_all()
        
        # Check if users already exist
        if User.query.count() == 0:
            # Create 5 default accounts
            default_users = [
                {'username': 'user1', 'password': 'password1', 'display_name': 'สมชาย'},
                {'username': 'user2', 'password': 'password2', 'display_name': 'สมหญิง'},
                {'username': 'user3', 'password': 'password3', 'display_name': 'สมศักดิ์'},
                {'username': 'user4', 'password': 'password4', 'display_name': 'สมศรี'},
                {'username': 'user5', 'password': 'password5', 'display_name': 'สมปอง'},
            ]
            
            for user_data in default_users:
                user = User(
                    username=user_data['username'],
                    password=hash_password(user_data['password']),
                    display_name=user_data['display_name']
                )
                db.session.add(user)
            
            db.session.commit()
            
            # Create sample restaurants
            sample_restaurants = [
                {
                    'user_id': 1,
                    'name': 'ร้านข้าวแกง ป้าแมว',
                    'open_time': '10:00',
                    'close_time': '14:00',
                    'location': 'ตลาดมหาวิทยาลัย',
                    'pickup_time': '12:30',
                    'pickup_location': 'หน้าตึก IT',
                    'image_url': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400'
                },
                {
                    'user_id': 2,
                    'name': 'ก๋วยเตี๋ยวลุงเป็ด',
                    'open_time': '08:00',
                    'close_time': '15:00',
                    'location': 'หน้าโรงเรียน',
                    'pickup_time': '11:30',
                    'pickup_location': 'ลานจอดรถ ตึก B',
                    'image_url': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'
                },
                {
                    'user_id': 3,
                    'name': 'ส้มตำครัวอีสาน',
                    'open_time': '09:00',
                    'close_time': '20:00',
                    'location': 'ถนนพหลโยธิน',
                    'pickup_time': '18:00',
                    'pickup_location': 'หอพัก A',
                    'image_url': 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400'
                },
            ]
            
            for r_data in sample_restaurants:
                restaurant = Restaurant(**r_data)
                db.session.add(restaurant)
            
            db.session.commit()
            
            # Create sample menu items
            sample_menus = [
                # ร้านข้าวแกง
                {'restaurant_id': 1, 'name': 'ข้าวแกงเขียวหวาน', 'price': 45, 'description': 'แกงเขียวหวานไก่พร้อมข้าวสวย', 'image_url': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400'},
                {'restaurant_id': 1, 'name': 'ข้าวผัดกระเพรา', 'price': 50, 'description': 'ผัดกระเพราหมูสับไข่ดาว', 'image_url': 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=400'},
                {'restaurant_id': 1, 'name': 'ข้าวไข่เจียว', 'price': 35, 'description': 'ไข่เจียวหมูสับ', 'image_url': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400'},
                {'restaurant_id': 1, 'name': 'ข้าวหมูทอดกระเทียม', 'price': 55, 'description': 'หมูทอดกระเทียมกรอบนอกนุ่มใน', 'image_url': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'},
                
                # ก๋วยเตี๋ยว
                {'restaurant_id': 2, 'name': 'ก๋วยเตี๋ยวหมูตุ๋น', 'price': 50, 'description': 'น้ำใสหมูตุ๋นนุ่ม', 'image_url': 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400'},
                {'restaurant_id': 2, 'name': 'ก๋วยเตี๋ยวต้มยำ', 'price': 55, 'description': 'รสเปรี้ยวเผ็ดจัดจ้าน', 'image_url': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400'},
                {'restaurant_id': 2, 'name': 'บะหมี่แห้ง', 'price': 45, 'description': 'บะหมี่แห้งหมูแดง', 'image_url': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400'},
                {'restaurant_id': 2, 'name': 'เกี๊ยวน้ำ', 'price': 40, 'description': 'เกี๊ยวหมูสด', 'image_url': 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400'},
                
                # ส้มตำ
                {'restaurant_id': 3, 'name': 'ส้มตำไทย', 'price': 40, 'description': 'ส้มตำมะละกอสด', 'image_url': 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400'},
                {'restaurant_id': 3, 'name': 'ส้มตำปูปลาร้า', 'price': 50, 'description': 'ส้มตำปูใส่ปลาร้า', 'image_url': 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400'},
                {'restaurant_id': 3, 'name': 'ไก่ย่าง', 'price': 80, 'description': 'ไก่ย่างครึ่งตัว', 'image_url': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400'},
                {'restaurant_id': 3, 'name': 'ลาบหมู', 'price': 60, 'description': 'ลาบหมูสด', 'image_url': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'},
            ]
            
            for m_data in sample_menus:
                menu_item = MenuItem(**m_data)
                db.session.add(menu_item)
            
            db.session.commit()
            
            print("Database initialized with sample data!")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)
