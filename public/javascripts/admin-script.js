const  fileInput = document.getElementById('fileInput');
const addVariant = document.getElementById('add-variant');
const addUpdatedVariant =  document.getElementById('add-updated-variant');

if(fileInput){
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });
}

function handleFiles(files) {
    const p = document.getElementById("status");
    let count = files.length;
    if (count > 7) {
        alert('You can only upload up to 7 images.');
        count = 7; // Limit to 7 images
        files = Array.from(files).slice(0, 7);
    } else if (count < 3) {
        alert('You must upload at least 3 images.');
        count = 0; // Reset count if less than 3 images
        files = [];
    }
    if (count > 0) {
        p.textContent = `Uploaded ${count}, left ${7 - count} image(s)`;
    } else {
        p.textContent = 'You must upload at least 3 images.';
    }

    document.getElementById('fileCount').textContent = `Selected ${count} image(s)`;
    // Here you could add code to show thumbnails or image previews if needed
}

if(addVariant){
    addVariant.addEventListener('click', function () {
        const container = document.getElementById('variants-container');
        const index = container.children.length;
    
        const newVariant = document.createElement('div');
        newVariant.classList.add('variant-entry', 'bg-gray-50', 'p-4', 'rounded-lg', 'border', 'border-gray-200');
    
        newVariant.innerHTML = `
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Model No</label>
                                        <input name="variants[${index}][modelno]" type="text" 
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    </div>
    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                            <select name="variants[${index}][size]" 
                                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="None">Select Size</option>
                                                <option value="XS">XS</option>
                                                <option value="S">S</option>
                                                <option value="M">M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                                <option value="XXL">XXL</option>
                                                <option value="XXXL">XXXL</option>
                                            </select>
                                        </div>
    
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                                            <input name="variants[${index}][quality]" type="text" 
                                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                    </div>
    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                            <input name="variants[${index}][price]" type="number" 
                                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                                            <input name="variants[${index}][discount]" type="number" 
                                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                            <input name="variants[${index}][quantity]" type="number" 
                                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                    </div>
                                </div>
                                `;
        container.appendChild(newVariant);
    });
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

if(addUpdatedVariant){
    addUpdatedVariant.addEventListener('click', function() {
        
        const container = document.getElementById('variants-updated-container');
        const index = container.children.length;
    
        const newVariant = document.createElement('div');
        newVariant.classList.add('variant-updated-entry', 'bg-gray-50', 'p-4', 'rounded-lg', 'border', 'border-gray-200');
        newVariant.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Model No</label>
                    <input name="variants[${index}][modelno]" type="text" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
    
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
                        <select name="variants[${index}][size]"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="None">Select Size</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                            <option value="XXXL">XXXL</option>
                        </select>
                    </div>
    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                        <input name="variants[${index}][quality]" type="text" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
    
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input name="variants[${index}][price]" type="number" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                        <input name="variants[${index}][discount]" type="number"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input name="variants[${index}][quantity]" type="number" required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
            </div>
        `;
        container.appendChild(newVariant);
    });
}