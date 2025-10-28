import os
from datetime import date, datetime, time, timedelta
from flask import Flask, flash, g, jsonify, redirect, render_template, request, session
from flask_session import Session
import sqlite3
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required

def adapt_datetime(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")

sqlite3.register_adapter(datetime, adapt_datetime)

# Configure application
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_TYPE"] = "filesystem"
# Configure extra security measures
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-insecure")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=8)

Session(app)

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    """Show homepage"""
    return render_template("index.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 400)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 400)
        
        # Open database connection
        db = get_db()
        cursor = db.cursor()

        # Query database for username
        cursor.execute("SELECT * FROM users WHERE username = ?", (request.form.get("username"),))
        rows = cursor.fetchall()

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        username = request.form.get("username")
        if not username:
            return apology("must provide username", 400)

        # Ensure password was submitted
        password = request.form.get("password")
        if not password:
            return apology("must provide password", 400)

        # Ensure repeated password was submitted
        confirmation = request.form.get("confirmation")
        if not confirmation:
            return apology("must repeat password", 400)

        # Check if password and repeated password are the same
        elif password != confirmation:
            return apology("passwords must be the same", 400)
        
        # Open database connection
        db = get_db()
        cursor = db.cursor()

        # Check if username already is taken
        try:
            #print("username: " + request.form.get("username") + " password: " + request.form.get("password"))
            cursor.execute("INSERT INTO users (username, hash) VALUES(?, ?)", (username, generate_password_hash(password)))
        except sqlite3.IntegrityError:
            return apology("username already taken", 400)
        except Exception as e:
            print("Error: ", e)
            return apology("general error", 400)

        # Commit changes to the database
        db.commit()

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("register.html")
    

@app.route("/timetable", methods=["GET"])
@login_required
def timetable():
    """Show timetable"""

    # User reached route via GET (as by clicking a link or via redirect)
    return render_template("timetable.html")


@app.route("/events")
@login_required
def get_events():
    """Show timetable and add events"""
    
    # Open database connection
    db = get_db()
    cursor = db.cursor()
        
    # Request all event data
    try:
        rows = cursor.execute("SELECT id, title, description, start_datetime, end_datetime FROM events WHERE user_id = ?", (session["user_id"],)).fetchall()
    except Exception as e:
        print("Error: ", e)
        flash("HTTP 500 Internal server error", "danger")
        return render_template("timetable.html", show_modal=True)
    events = []
    for id, title, description, start_dt, end_dt in rows:
        if isinstance(end_dt, str):
            end_dt = datetime.fromisoformat(end_dt)
            
        if end_dt:
            if end_dt.time() == time(0, 0, 0):
                end_dt += timedelta(days=1)
            end_dt = str(end_dt)
        else:
            end_dt = None
        
        events.append({
            "id": id,
            "title": title,
            "description": description,
            "start": start_dt,                
            "end": end_dt
        })
    return jsonify(events)
   
   
@app.route("/events/new", methods=["POST"])
@login_required
def new_event():
    """Add events"""

    title = request.form.get("title")
    if not title:
        flash("Title is required!", "danger")
        return render_template("timetable.html", show_modal=True)
        
    description = request.form.get("description")
    if len(description) > 200:
        flash("Description is longer than 200 characters!", "danger")
        return render_template("timetable.html", show_modal=True)
        
    start_date = request.form.get("start-date")
    end_date = request.form.get("end-date")
    # Ensure start date exists
    if not start_date and not end_date:
        flash("Start & End date is required!", "danger")
        return render_template("timetable.html", show_modal=True)
    # Ensure start date exists
    elif not start_date:
        flash("Start date is required!", "danger")
        return render_template("timetable.html", show_modal=True)
    # Ensure end date exists
    elif not end_date:
        flash("End date is required!", "danger")
        return render_template("timetable.html", show_modal=True)
        
    start_datetime = datetime.strptime(start_date, "%d/%m/%y").date()
    end_datetime = datetime.strptime(end_date, "%d/%m/%y").date()
    # Ensure dates are not in the past
    if start_datetime < date.today() or end_datetime < date.today():
        flash("Cannot plan in the past", "danger")
        return render_template("timetable.html", show_modal=True)
        
    # Open database connection
    db = get_db()
    cursor = db.cursor()
        
    start_datetime = adapt_datetime(start_datetime)
    end_datetime = adapt_datetime(end_datetime)
        
    # Save the event
    try:
        cursor.execute("INSERT INTO events (user_id, title, description, start_datetime, end_datetime, category_id) VALUES(?, ?, ?, ?, ?, ?)"
                        ,(session["user_id"], title, description, start_datetime, end_datetime, 1)) # 1 means uncategorized
    except Exception as e:
        print("Error: ", e)
        flash("HTTP 500 Internal server error", "danger")
        return render_template("timetable.html"), 500
        
    # Commit changes to the database
    db.commit()

    # Redirect user to timetable
    return redirect("/timetable")

@app.route("/events/edit", methods=["POST"])
@login_required
def edit_event():
    """Edit events"""
    
    return redirect("/timetable")
    
@app.route("/events/delete/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    """Delete events"""
    try:
        # 1 Find event in db
        
        # 2. Check if the event exists
        # if not event_to_delete:
        #     return jsonify({"error": "Event not found"}), 404
        
        # 3. Perform the deletion (e.g., db.session.delete(event_to_delete))
        # 4 Commit to db
        
        # Return a successful empty respone
        return '', 204
    
    except Exception as e:
        # Log the error for debugging
        print(f"Error deleting event {event_id}: {e}")
        # Return a server error response
        return jsonify({"error": "Server error during deletion"}), 500


def get_db():
    """Open a new database connection if there is not one opened yet."""
    if "db" not in g:
        g.db = sqlite3.connect("scheduly.db")
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    """Close database at the end of the request"""
    db = g.pop("db", None)
    if db is not None:
        db.close()


if __name__ == "__main__":
    app.run(debug=True)