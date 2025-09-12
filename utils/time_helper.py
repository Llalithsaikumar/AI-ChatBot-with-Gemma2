from datetime import datetime
import pytz

def get_ist_time():
    """Get current time in IST with proper formatting"""
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)
    return current_time.strftime("%I:%M %p")

def get_ist_date():
    """Get current date in IST with proper formatting"""
    ist = pytz.timezone('Asia/Kolkata')
    current_date = datetime.now(ist)
    return current_date.strftime("%d %B, %Y")

def get_ist_datetime():
    """Get current date and time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)
