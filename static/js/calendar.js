import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return; // Only run if the page has a calendar

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
            headerToolbar: {
            left: 'prev,next today addEventbutton',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek,timeGridDay'
            },
            customButtons: {
              addEventbutton: {
                //icon: 'custom-icon-class',  Then style it in CSS
                text: '+ Event',
                click: function () {
                  
                }
              }
            },
            events: [
            { title: 'Event 1', start: '2025-08-20' },
            { title: 'Event 2', start: '2025-08-20', end: '2025-08-23' }
            ],
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
            }
  });

  calendar.render();

  calendar.render();

  // Add Bootstrap modal attributes to the custom button
  const btn = document.querySelector('.fc-addEventbutton-button');
  if (btn) {
    btn.setAttribute('type', 'button');
    btn.setAttribute('class', 'btn btn-primary fc-addEventbutton-button');
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#Modal');
    btn.setAttribute('data-bs-name', 'New Event');
  }

  // Handles modal content updates
  const Modal = document.getElementById('Modal');
  if (Modal) {
    Modal.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const modalName = button.getAttribute('data-bs-name');

      const modalTitle = Modal.querySelector('.modal-title');

      modalTitle.textContent = modalName;
    });
  }
});

$('#event-datepicker').datepicker({
    format: "dd/mm/yy",
    weekStart: 1,
    startDate: 0,
    maxViewMode: 2,
    todayBtn: "linked",
    calendarWeeks: true,
    todayHighlight: true
});