document.addEventListener("DOMContentLoaded", () => {
  const titleSpan = document.getElementById("modal-title");
  titleSpan.addEventListener("click", editTitle);
});

function editTitle() {
    const span = document.getElementById('modal-title');
    const input = document.getElementById('modal-title-input');
    
    input.value = span.textContent;
    span.style.display = 'none';
    input.style.display = 'inline-block';
    input.focus();
    input.select(); // select all text
}

document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("modal-title-input");
  titleInput.addEventListener("blur", saveTitle);
});

function saveTitle() {
    const span = document.getElementById('modal-title');
    const input = document.getElementById('modal-title-input');
    const newText = input.value.trim();
    span.textContent = newText;
    console.log("Saving title: ", input.value);
    if (newText === "") {
        input.placeholder = "Title is required";
        input.classList.add('is-invalid');
        return;
    }
    input.classList.remove('is-invalid');
    input.style.display = 'none';
    span.style.display = 'inline';
}

// Save on Enter key
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('modal-title-input');
    input.value = "New Event"; // Default value
    input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // prevent form submission
        input.blur();       // triggers saveTitle via onblur
    }
    });
});