const getLocationBtn = document.getElementById('getLocationBtn');
const addressCard = document.getElementById('addressCard');
const addressDetails = document.getElementById('address-details');
const copyBtn = document.getElementById('copyBtn');
const errorDiv = document.getElementById('error');
const copyFeedback = document.getElementById('copyFeedback');
const loader = document.getElementById('loader');

// To store the full address for the copy function
let fullAddressForCopy = '';

getLocationBtn.addEventListener('click', () => {
    // Reset state
    addressCard.classList.add('hidden');
    errorDiv.classList.add('hidden');
    copyFeedback.classList.add('hidden');
    addressDetails.innerHTML = ''; // Clear previous results
    
    // Show loader and hide button
    getLocationBtn.classList.add('hidden');
    loader.classList.remove('hidden');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    } else {
        showError({ message: "المتصفح لا يدعم تحديد الموقع الجغرافي." });
    }
});

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ar&addressdetails=1`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.address) {
                displayAddress(data.address);
                addressCard.classList.remove('hidden');
            } else {
                 showError({ message: "لم نتمكن من تفكيك العنوان. سنعرض العنوان الكامل." , fallback: data.display_name });
            }
            resetUI();
        })
        .catch(err => {
            showError({ message: "حدث خطأ أثناء جلب العنوان من الخادم." });
            resetUI();
        });
}

function displayAddress(address) {
    addressDetails.innerHTML = ''; // Clear previous content
    const addressParts = [];

    const addressMap = [
        { key: 'road', label: 'الشارع' },
        { key: 'house_number', label: 'رقم المبنى' },
        { key: 'suburb', label: 'الحي' },
        { key: 'city', label: 'المدينة' },
        { key: 'state', label: 'المنطقة/الولاية' },
        { key: 'postcode', label: 'الرمز البريدي' },
        { key: 'country', label: 'الدولة' }
    ];

    addressMap.forEach(item => {
        if (address[item.key]) {
            const div = document.createElement('div');
            div.className = 'address-item';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = `${item.label}:`;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            valueSpan.textContent = address[item.key];
            
            div.appendChild(labelSpan);
            div.appendChild(valueSpan);
            addressDetails.appendChild(div);

            // Add to the text that will be copied
            addressParts.push(`${item.label}: ${address[item.key]}`);
        }
    });

    fullAddressForCopy = addressParts.join('\n');
}


function showError(error) {
    let errorMessage = "حدث خطأ غير معروف.";
    
    // Handle fallback for display_name
    if (error.fallback) {
        addressDetails.innerHTML = `<p>${error.fallback}</p>`;
        fullAddressForCopy = error.fallback;
        addressCard.classList.remove('hidden');
    }

    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "لقد رفضت طلب تحديد الموقع. يرجى السماح بالوصول للمتابعة.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "معلومات الموقع غير متاحة حالياً.";
            break;
        case error.TIMEOUT:
            errorMessage = "انتهى وقت طلب تحديد الموقع. يرجى المحاولة مرة أخرى.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "حدث خطأ غير معروف أثناء تحديد الموقع.";
            break;
    }
    
    if (error.message && !error.code) {
        errorMessage = error.message;
    }
    
    errorDiv.textContent = errorMessage;
    errorDiv.classList.remove('hidden');
    resetUI();
}

function resetUI() {
    loader.classList.add('hidden');
    getLocationBtn.classList.remove('hidden');
}

copyBtn.addEventListener('click', () => {
    if (!fullAddressForCopy) return;

    navigator.clipboard.writeText(fullAddressForCopy).then(() => {
        copyFeedback.textContent = 'تم النسخ بنجاح!';
        copyFeedback.classList.remove('hidden');
        setTimeout(() => {
            copyFeedback.classList.add('hidden');
        }, 2500);
    }).catch(err => {
        copyFeedback.textContent = 'فشل النسخ!';
        copyFeedback.style.color = 'var(--error-text)';
        copyFeedback.classList.remove('hidden');
         setTimeout(() => {
            copyFeedback.classList.add('hidden');
            copyFeedback.style.color = 'var(--success-color)'; // Reset for next time
        }, 2500);
    });
});
