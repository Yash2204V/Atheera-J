document.addEventListener('DOMContentLoaded', () => {
    const flashMessages = document.querySelectorAll('.fixed.top-5');
    
    flashMessages.forEach(message => {
        // Entry animation
        message.style.opacity = '0';
        message.style.transform = 'translate(-50%, -20px)';
        requestAnimationFrame(() => {
            message.style.transition = 'opacity 0.3s, transform 0.3s';
            message.style.opacity = '1';
            message.style.transform = 'translate(-50%, 0)';
        });

        // Close button handler
        const closeBtn = message.querySelector('button');
        closeBtn.addEventListener('click', () => {
            message.style.opacity = '0';
            message.style.transform = 'translate(-50%, -20px)';
            setTimeout(() => message.remove(), 300);
        });

        // Auto-hide after 4 seconds
        let timeout = setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translate(-50%, -20px)';
            setTimeout(() => message.remove(), 300);
        }, 4000);

        // Pause hide on hover
        message.addEventListener('mouseenter', () => clearTimeout(timeout));
        message.addEventListener('mouseleave', () => {
            timeout = setTimeout(() => {
                message.style.opacity = '0';
                message.style.transform = 'translate(-50%, -20px)';
                setTimeout(() => message.remove(), 300);
            }, 2000);
        });
    });
});