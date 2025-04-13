document.addEventListener('DOMContentLoaded', () => {
    const audioFileInput = document.getElementById('audioFile');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    const summaryText = document.getElementById('summaryText');
    const taskList = document.getElementById('taskList');

    summarizeBtn.addEventListener('click', async () => {
        const file = audioFileInput.files[0];
        if (!file) {
            alert('Please select an audio file first');
            return;
        }

        // Show loading spinner
        loadingSpinner.style.display = 'block';
        resultsContainer.classList.add('hidden');

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch('/upload-call', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process audio');
            }

            const data = await response.json();
            
            // For demo purposes - in real app this would come from the API
            const demoData = {
                summary: "The call discussed the upcoming project deadline. John agreed to send the proposal by Friday. Mary will book flight tickets for the client meeting on Monday.",
                tasks: [
                    { task: "Send the proposal", due: "Friday" },
                    { task: "Book flight tickets", due: "Monday" }
                ]
            };

            // Display results
            summaryText.textContent = demoData.summary;
            taskList.innerHTML = demoData.tasks.map(task => `
                <li class="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                        <span class="font-medium">${task.task}</span>
                        <span class="text-sm text-gray-500 ml-2">Due: ${task.due}</span>
                    </div>
                    <button class="mark-done-btn text-green-500 hover:text-green-600">
                        <i class="fas fa-check"></i>
                    </button>
                </li>
            `).join('');

            resultsContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing your request');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // Event delegation for mark as done buttons
    taskList.addEventListener('click', (e) => {
        if (e.target.closest('.mark-done-btn')) {
            const listItem = e.target.closest('li');
            listItem.classList.add('line-through', 'text-gray-400');
            listItem.querySelector('.mark-done-btn').remove();
        }
    });
});
