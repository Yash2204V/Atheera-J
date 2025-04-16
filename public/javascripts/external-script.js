const enquiryBtnSing = document.getElementById("enquiry-btn-single");
const enquiryBtnMulti = document.getElementById("enquiry-btn-multiple");

// Filter toggle functionality for mobile
const filterToggle = document.getElementById('filter-toggle');
const filterSidebar = document.getElementById('filter-sidebar');
const filterOverlay = document.getElementById('filter-overlay');
const closeFilter = document.getElementById('close-filter');

if (enquiryBtnSing) {
    enquiryBtnSing.addEventListener("click", () => {
        const id = enquiryBtnSing.getAttribute("data-value");
        const products = enquiryBtnSing.getAttribute("data-product");
        
        // Extract available sizes
        const sizeRegex = /size:\s*'([^']*)'/g;
        const sizes = [];
        let match;
        while ((match = sizeRegex.exec(products)) !== null) {
            sizes.push(match[1]);
        }
        const uniqueSizes = [...new Set(sizes)];
        const availableSizesStr = uniqueSizes.join(', ');

        // Get user input
        const userInput = prompt('Enter your phone number (e.g., +91-9876543210):')?.trim();
        if (!userInput) return;

        // Get size with validation
        const variant = prompt(`Enter Available Size (${availableSizesStr}):`)?.trim();
        if (!variant) return;
        // console.log(variant.charAt(0).toUpperCase() + variant.slice(1));
        const currSize = variant.charAt(0).toUpperCase() + variant.slice(1);
        // Validate size
        if (!uniqueSizes.includes(currSize)) {
            return alert(`Invalid size! ${currSize}; Available sizes: ${availableSizesStr}`);
        }

        // Final confirmation
        const isConfirmed = confirm(
            `Please confirm your details:\n\n` +
            `Phone Number: ${userInput}\n` +
            `Selected Size: ${variant}\n\n` +
            `Is this information correct?`
        );

        if (isConfirmed) {
            window.location.href = `/products/enquiry/single/${id}?query=` +
                encodeURIComponent(userInput) +
                `&variant=` +
                encodeURIComponent(variant);
        } else {
            alert('Submission canceled. Please try again with correct details.');
        }
    });
}

if (enquiryBtnMulti) {
    enquiryBtnMulti.addEventListener("click", () => {
        const userInput = prompt('Please enter your phone number & proceed: (eg. +91-9876543210)');
        if(!userInput) return;
        // Final confirmation
        const isConfirmed = confirm(
            `Please confirm your details:\n\n` +
            `Phone Number: ${userInput}\n` +
            `Is this information correct?`
        );
        if (isConfirmed) {
            window.location.href = `/products/enquiry/multiple?query=` + encodeURIComponent(userInput);
        }
    });
}

// --------------------------------------------------------------------------------

document.querySelectorAll('.quantity-btn').forEach(button => {
    button.addEventListener("click", () => {
        const productId = button.getAttribute("data-id");
        const input = document.getElementById(`quantity-${productId}`);
        let change = parseInt(button.getAttribute("data-value"));
        let newVal = parseInt(input.value) + change;

        // Enforce min/max values
        newVal = Math.max(1, Math.min(10, newVal));
        input.value = newVal;
    });
});

// --------------------------------------------------------------------------------

const sortType = document.getElementById('sort-type');
if (sortType) {
    sortType.addEventListener('change', (e) => {
        updateSort(e.target.value);
    });
}

function updateSort(value) {
    const [sortBy, sortOrder] = value.split('_');
    const url = new URL(window.location.href);
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortOrder', sortOrder);
    window.location = url.toString();
}

// -----------------------------------------------------------------------------

if (filterToggle && filterSidebar && filterOverlay) {
    filterToggle.addEventListener('click', () => {
        filterSidebar.classList.remove('hidden');
        filterOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    closeFilter?.addEventListener('click', () => {
        filterSidebar.classList.add('hidden');
        filterOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    });

    filterOverlay.addEventListener('click', () => {
        filterSidebar.classList.add('hidden');
        filterOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    });
}


let mainImg = document.getElementById('main-img')
let imgBars = document.getElementsByClassName('single-img')

if (mainImg && imgBars) {
    for (let imgBar of imgBars) {
        imgBar.addEventListener('click', function () {
            clearActive()
            let imgPath = this.getAttribute('src')
            mainImg.setAttribute('src', imgPath)
            this.classList.add('border-primary')
        })
    }

    function clearActive() {
        for (let imgBar of imgBars) {
            imgBar.classList.remove('border-primary')
        }
    }
}

// Quantity input handling
document.addEventListener('DOMContentLoaded', function () {
    const quantityInput = document.querySelector('input[name="quantity"]');
    const decrementBtn = document.querySelector('[data-action="decrement"]');
    const incrementBtn = document.querySelector('[data-action="increment"]');

    if (quantityInput && decrementBtn && incrementBtn) {
        function updateQuantity(newValue) {
            const value = Math.min(Math.max(parseInt(newValue) || 1, 1), 10);
            quantityInput.value = value;
        }

        decrementBtn.addEventListener('click', () => {
            updateQuantity(parseInt(quantityInput.value) - 1);
        });

        incrementBtn.addEventListener('click', () => {
            updateQuantity(parseInt(quantityInput.value) + 1);
        });

        quantityInput.addEventListener('change', (e) => {
            updateQuantity(e.target.value);
        });
    }
});