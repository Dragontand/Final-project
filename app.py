import os
from datetime import date, datetime, timedelta
from flask import Flask, flash, g, jsonify, redirect, render_template, request, session, url_for
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
            flash("HTTP error: 400 must provide a username!", "danger")
            return render_template("timetable.html"), 400

        # Ensure password was submitted
        elif not request.form.get("password"):
            flash("HTTP error: 400 must provide a password!", "danger")
            return render_template("timetable.html"), 400
        
        # Open db connection
        db = get_db()
        cursor = db.cursor()

        # Query db for username
        cursor.execute("SELECT * FROM users WHERE username = ?", (request.form.get("username"),))
        rows = cursor.fetchall()

        # Ensure username exists and password is correct
        if len(rows) != 1:
            flash("HTTP error: 404 user not found!", "danger")
            return render_template("timetable.html"), 404
        
        # Gives general error if passwords don't match
        if not check_password_hash(rows[0]["hash"], request.form.get("password")):
            flash("HTTP error: 400 invalid username and or password!", "danger")
            return render_template("timetable.html"), 400

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
            flash("HTTP error: 400 must provide a username!", "danger")
            return render_template("timetable.html"), 400

        # Ensure password was submitted
        password = request.form.get("password")
        if not password:
            flash("HTTP error: 400 must provide a password!", "danger")
            return render_template("timetable.html"), 400

        # Ensure repeated password was submitted
        confirmation = request.form.get("confirmation")
        if not confirmation:
            flash("HTTP error: 400 must repeat password!", "danger")
            return render_template("timetable.html"), 400

        # Check if password and repeated password are the same
        elif password != confirmation:
            flash("HTTP error: 400 password must be the same!", "danger")
            return render_template("timetable.html"), 400
        
        # Open db connection
        db = get_db()
        cursor = db.cursor()

        # Check if username already is taken
        try:
            #print("username: " + request.form.get("username") + " password: " + request.form.get("password"))
            cursor.execute("INSERT INTO users (username, hash) VALUES(?, ?)", (username, generate_password_hash(password)))
        except sqlite3.IntegrityError:
            flash("HTTP error: 400 username already taken!", "danger")
            return render_template("timetable.html"), 400
        except Exception as e:
            print("Error: ", e)
            flash("HTTP error: 500 internal server error!", "danger")
            return render_template("timetable.html"), 500

        # Commit changes to the db
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

    form_data = session.pop("form_data")
    
    form_data_exsists = False
    if form_data is not None:
        form_data_exsists = True
    
    # User reached route via GET (as by clicking a link or via redirect)
    return render_template("timetable.html", show_modal=form_data_exsists, form_data=form_data)


@app.route("/events", methods=["GET"])
@login_required
def get_events():
    """Show timetable and add events"""
    
    # Open db connection
    db = get_db()
    cursor = db.cursor()
        
    # Request all event data
    try:
        rows = cursor.execute("SELECT id, title, description, start_datetime, end_datetime FROM events WHERE user_id = ?",
                              (session["user_id"],)).fetchall()
    except Exception as e:
        print("Error: ", e)
        flash("HTTP error: 500 internal server error!", "danger")
        return render_template("timetable.html"), 500
    events = []
    for id, title, description, start_dt_str, end_dt_str in rows:
        try:
            if start_dt_str:
                start_dt = datetime.fromisoformat(start_dt_str)
            else:
                start_dt = None
        except ValueError:
            start_dt = None
        try:
            if end_dt_str:
                end_dt = datetime.fromisoformat(end_dt_str)
            else:
                end_dt = None
        except ValueError:
            end_dt = None
        
        # If the start date + 1 day is the same as the end date then set fullday to true
        is_all_day = False
        if (start_dt.date() + timedelta(days=1)) == end_dt.date():
            is_all_day = True
        
        event = {
            "id": id,
            "title": title,
            "extendedProps": {"description": description},
            "start": str(start_dt),                
            "end": str(end_dt)
        }
        
        # Add the allDay property for Fullcalendar
        if is_all_day:
            event["allDay"] = True
            
        events.append(event)
        #print(event.items())          
    return jsonify(events)
   
   
@app.route("/events/new", methods=["POST"])
@login_required
def new_event():
    """Add events"""

    # Run all checks
    event = check_event()
    
    # If error return the error and store the form in the session
    if event is None:
        session["form_data"] = request.form
        session["form_data"]["type"] = "new"
        return redirect(url_for("timetable"))
    
    # Open db connection
    db = get_db()
    cursor = db.cursor()
    
    # Save the event
    try:
        cursor.execute("INSERT INTO events (user_id, title, description, start_datetime, end_datetime, category_id) VALUES(?, ?, ?, ?, ?, ?)"
                        ,(session["user_id"], event["title"], event["description"], event["start_dt"], event["end_dt"], 1)) # 1 means uncategorized
    except Exception as e:
        print(e)
        flash("HTTP error: 500 internal server error!", "danger")
        return render_template("timetable.html", show_modal=True), 500
        
    # Commit changes to the db
    db.commit()

    flash("Event succesfully saved!", "success")
    # Redirect user to timetable
    return redirect("/timetable"), 205


@app.route("/events/edit/<int:event_id>", methods=["POST"])
@login_required
def edit_event(event_id):
    """Edit events"""
    
    # Run all checks
    edited_event = check_event()
    
   # If error return the error and store the form in the session
    if edited_event is None:
        session["form_data"] = request.form
        session["form_data"]["type"] = "edit"
        return redirect(url_for("timetable"))
    
    # Open db connection
    db = get_db()
    cursor = db.cursor()
    
    # Edit the event
    try:
        parameters = (
            edited_event["title"],
            edited_event["description"],
            edited_event["start_dt"], 
            edited_event["end_dt"], 
            1,  # 1 means uncategorized
            session["user_id"], 
            event_id
        )
        
        cursor.execute("UPDATE events SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, category_id = ? WHERE user_id = ? AND id = ?"
                        ,parameters)
    except Exception as e:
        print(e)
        flash("HTTP error: 500 internal server error!", "danger")
        return render_template("timetable.html", show_modal=True), 500
        
    # Commit changes to the db
    db.commit()

    # Redirect user to timetable
    return redirect("/timetable"), 205

    
@app.route("/events/delete/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    """Delete events"""
    
    # Open db connection
    db = get_db()
    cursor = db.cursor()
    try:   
        # 1 Find event in db
        cursor.execute("SELECT user_id FROM events WHERE id = ?", (event_id,))
        event = cursor.fetchone()
        
        # 2 Check if the event exists
        if not event:
            return jsonify({"HTTP error": "404 event not found!"}), 404
        # 3 Check if the event is of the specified user
        if event["user_id"] != session["user_id"]:
            return jsonify({"HTTP error": "403 unauthorized to delete this event!"}), 403
        
        # 4 Perform the deletion (e.g., db.session.delete(event_to_delete))
        cursor.execute("DELETE FROM events WHERE id = ? AND user_id = ?", (event_id, session["user_id"]))
        # 5 Commit changes to the db
        db.commit()
        # Return a successful empty respone
        return '', 204
    
    except Exception as e:
        # Log the error for debugging
        print(f"Error deleting event {event_id}: {e}")
        # Return a server error response
        return jsonify({"HTTP error": "500 server error during deletion"}), 500


def check_event():
    event = {}
    
    title = request.form.get("title")
    if not title:
        flash("HTTP error: 400 title is required!", "danger")
        return None
    event["title"] = title
     
    description = request.form.get("description")
    if len(description) > 200:
        flash("HTTP error: 400 description is longer than 200 characters!", "danger")
        return None
    event["description"] = description
        
    start_date = request.form.get("start-date")
    end_date = request.form.get("end-date")
    # Ensure start date exists
    if not start_date and not end_date:
        flash("HTTP error: 400 start & End date is required!", "danger")
        return None
    # Ensure start date exists
    elif not start_date:
        flash("HTTP error: 400 start date is required!", "danger")
        return None
    # Ensure end date exists
    elif not end_date:
        flash("HTTP error: 400 end date is required!", "danger")
        return None
    # Make start and end datetime into datetime objects
    start_dt = datetime.strptime(start_date, "%d-%m-%Y")
    end_dt = datetime.strptime(end_date, "%d-%m-%Y")
    # Ensure dates are not in the past
    if start_dt < datetime.today() or end_dt < datetime.today():
        flash("HTTP error: 400 cannot plan in the past", "danger")
        return None
    
    # Make end date follow the ICalendar specs
    end_dt += timedelta(days=1)
    # Make into isoformat strings
    start_dt_str = start_dt.isoformat()
    end_dt_str = end_dt.isoformat()
    
    # Add dates to event dict
    event["start_dt"] = start_dt_str
    event["end_dt"] = end_dt_str
    
    return event


def get_db():
    """Open a new db connection if there is not one opened yet."""
    if "db" not in g:
        g.db = sqlite3.connect("scheduly.db")
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(e=None):
    """Close db at the end of the request"""
    db = g.pop("db", None)
    if db is not None:
        db.close()


if __name__ == "__main__":
    app.run(debug=True)