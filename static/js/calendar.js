import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = $('#calendar')[0]; // To remove Jquery wrapper for Fullcalendar
  if (!calendarEl) return; // Only run if the page has a calendar
  const calendar = new Calendar(calendarEl, {
    // Config
    plugins: [dayGridPlugin, listPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    selectable: true,

    // Header toolbar
    headerToolbar: {
      left: 'prev next today addEvent',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },

    buttonText: {
      today:    'Today',
      month:    'Month',
      week:     'Week',
      day:      'Day',
      list:     'List'
    },

    // Custom buttons
    customButtons: {
      addEvent: {
        //icon: 'custom-icon-class',  Then style it in CSS
        text: '+ Event',
        click: function () {
          resetModalForNew();
          
          // Trigger modal
          const modalEl = $('#modal');
          if (modalEl && window.bootstrap) {
              const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalEl);
              bootstrapModal.show();
          }
        }
      }
    },

    events: '/events',

    // Clicking on event
    eventClick: function(info) {
    const event = info.event;
    
    fillModalForEdit(event);

    // Show modal manually
    const modalEl = $('#modal');
    if (modalEl && window.bootstrap) {
        const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bootstrapModal.show();
    }

    info.jsEvent.preventDefault(); 
  },
    // Formats
    eventTimeFormat: { // like '14:30'
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
    },

    slotLabelFormat: { // like '14:30'
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
    },

    eventsSet: function() {
      const eventFormType = $('#event-form-type-input').val();
      if (eventFormType === 'edit') {
        // Get event Fullcalendar via id
        const eventId = $('#event-id-input').val();
        const curEvent = calendar.getEventById(eventId);
        if (curEvent) {
          // Clear the type so that it doesn't repeat itself
          $('#event-form-type-input').val('');
          editSetup(curEvent);
        }
      }
    }
  });

  calendar.render();

  // Add Bootstrap modal attributes to the custom button
  const btn = document.querySelector('.fc-addEvent-button');
  if (btn) {
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#modal');
    btn.setAttribute('data-bs-name', 'New Event');
  }

  // Handles modal content updates
  const Modal = $('#modal')[0];
  if (Modal) {
    Modal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      if (button) {
        const modalName = button.getAttribute('data-bs-name');

        const modalTitle = Modal.querySelector('.modal-title');

        modalTitle.textContent = modalName;
      }
    });
  }
});

function resetModalForNew() {
    const modalEl = $('#modal');
    if (!modalEl) return;
    // Retrieve all input fields & empty them
    modalEl.find('#modal-title').text('New Event');
    $('#event-description').val('');
    $('#event-datepicker-start').val('');
    $('#event-datepicker-end').val('');
    $('#event-id-input').val('');
    $('#delete-event-button').hide();
    $('#submit-event-button').text('Save event');
}

function fillModalForEdit(event) {
    const modalEl = $('#modal');
    if (!modalEl) return;

    // 1. Setup date format
    const formatOptions = {
      day: '2-digit',    // ex: '05'
      month: '2-digit',  // ex: '04'
      year: 'numeric',   // ex: '2006'
      timeZone: 'Europe/Amsterdam' // Specify time zone
    };

    // 2. Retrieve all editable fields
    const titleSpan = modalEl.find('#modal-title');
    const descriptionTextarea = $('#event-description');
    const startDateInput = $('#event-datepicker-start');
    const endDateInput = $('#event-datepicker-end');
    const eventIdInput = $('#event-id-input');

    // 3. Fill in the retrieved data for the editable fields
    eventIdInput.val(event.id);
    titleSpan.text(event.title);
    descriptionTextarea.val(event.extendedProps.description || '');

    // 4. Counteract the specs of ICalendar for better visual representation
    const startDate = event.start;
    const endDate = event.end;
    const newEndDate = endDate.setDate(endDate.getDate() - 1);

    // 5. Format end date back & start date
    const customDutchFormat = new Intl.DateTimeFormat('nl-NL', formatOptions);
    const fortmattedStartDate = customDutchFormat.format(startDate);
    const formattedEndDate = customDutchFormat.format(endDate);
    const formattedNewEndDate = customDutchFormat.format(newEndDate);

    // 6. Fill in the dates
    startDateInput.val(fortmattedStartDate);
    endDateInput.val(formattedNewEndDate);

    // 7. Fill in bootstrap-datepicker
    $('#event-datepicker-start').datepicker('update', fortmattedStartDate);
    $('#event-datepicker-end').datepicker('update', formattedEndDate);

    // 8. Set up edit / delete mode
    editSetup(event);
}

function editSetup(event) {
    const deleteButton = $('#delete-event-button');
    const submitButton = $('#submit-event-button');
    const form = $('#modal-form');

    if (!event) {
      console.error('HTTP error: 404 could not find event!')
      return;
    }

    // 2. Set up ui for edit / delete mode
    submitButton.text('Edit event');
    deleteButton.show();
    form.attr('action', '/events/edit/' + event.id);

    // 3. Delete handler
    // .off() for deleting older handelers
    deleteButton.off('click').on('click', function () {
        if (confirm("Are you sure you want to delete it?")) {
          fetch('/events/delete/' + event.id, {
              method: 'DELETE'
          })
          .then(response => {
              if (response.ok) {
                  // If we have the event obj, remove it from the ui
                  if (event) {
                      event.remove();
                      const modalEl = document.getElementById('modal');
                      bootstrap.Modal.getInstance(modalEl).hide();
                  } else {
                      // If we do not have the event obj, refresh the page to clear data
                      window.location.reload();
                  }
              } else {
                  console.error('Error: Cannot delete event. Status: ' + response.status);
              }
          })
          .catch(error => console.error('Error deleting event:', error));
        }
    });
}

$('#event-datepicker').datepicker({
    format: "dd-mm-yyyy",
    weekStart: 1,
    startDate: 0,
    maxViewMode: 2,
    todayBtn: "linked",
    calendarWeeks: true,
    todayHighlight: true
});