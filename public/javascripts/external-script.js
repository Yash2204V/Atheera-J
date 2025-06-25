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
        const userInput = prompt('Please enter your number & proceed:');
        if (userInput) {
            window.location.href = `/products/enquiry/single/${id}?query=` + encodeURIComponent(userInput);
        }
    });
}

if (enquiryBtnMulti) {
    enquiryBtnMulti.addEventListener("click", () => {
        const userInput = prompt('Please enter your number & proceed:');
        if (userInput) {
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

// -----------------------------------------------------------------------------

let mainImg = document.getElementById('main-img')
let imgBars = document.getElementsByClassName('single-img')

if(mainImg && imgBars){
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


document.addEventListener('DOMContentLoaded', () => {
    const scrollPosition = localStorage.getItem("scrollPosition");
    if (scrollPosition) {
        window.scrollTo(0, parseInt(scrollPosition, 10));
    }
    const saveScrollPosition = () => {
        localStorage.setItem("scrollPosition", window.scrollY);
    };

    window.addEventListener("beforeunload", saveScrollPosition);
    return () => window.removeEventListener("beforeunload", saveScrollPosition);
});