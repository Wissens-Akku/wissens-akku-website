document.addEventListener('DOMContentLoaded', () => {
    // Create the popup container
    const popup = document.createElement('div');
    popup.id = 'whatsapp-popup';

    // The WhatsApp group link
    const whatsappLink = 'https://chat.whatsapp.com/HKEOwlFtnhE0ojvNOagus1';

    // Populate the popup's HTML
    popup.innerHTML = `
        <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: flex; align-items: center;">
            <img src="https://static.cdnlogo.com/logos/w/29/whatsapp-icon.svg" alt="WhatsApp Icon">
            <span>Gruppe beitreten</span>
        </a>
        <div class="close-btn" id="close-whatsapp-popup">&times;</div>
    `;

    // Append the popup to the body
    document.body.appendChild(popup);

    // Add event listener for the close button
    const closeBtn = document.getElementById('close-whatsapp-popup');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the link from being triggered
            popup.style.display = 'none';
        });
    }

    // Optional: Show popup after a delay
    setTimeout(() => {
        popup.style.display = 'flex';
    }, 2000); // 2 seconds delay
});
