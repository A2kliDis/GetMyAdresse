const getLocationBtn = document.getElementById('getLocationBtn');
const addressCard = document.getElementById('addressCard');
const addressDetails = document.getElementById('address-details');
const copyBtn = document.getElementById('copyBtn');
const errorDiv = document.getElementById('error');
const copyFeedback = document.getElementById('copyFeedback');
const loader = document.getElementById('loader');
const langButtons = {
    en: document.getElementById('lang-en'),
    ar: document.getElementById('lang-ar'),
};

let currentAddress = {};
let currentLang = 'ar'; 

const translations = {
    ar: {
        pageTitle: "أين أنا؟ | تحديد الموقع",
        mainTitle: "أين أنا؟",
        subtitle: "اضغط على الزر للحصول على عنوانك الفعلي بسهولة.",
        getLocationBtn: "احصل على عنواني الآن",
        cardTitle: "عنوانك الحالي",
        copyBtn: "نسخ العنوان",
        copyFeedback: "تم النسخ بنجاح!",
        copyFail: "فشل النسخ!",
        errorBrowser: "المتصفح لا يدعم تحديد الموقع الجغرافي.",
        errorFetch: "حدث خطأ أثناء جلب العنوان.",
        errorPermission: "لقد رفضت طلب تحديد الموقع. يرجى السماح بالوصول للمتابعة.",
        errorPosition: "معلومات الموقع غير متاحة حالياً.",
        errorTimeout: "انتهى وقت طلب تحديد الموقع. يرجى المحاولة مرة أخرى.",
        errorUnknown: "حدث خطأ غير معروف.",
        addressLabels: {
            road: 'الشارع',
            house_number: 'رقم المبنى',
            suburb: 'الحي',
            city: 'المدينة',
            state: 'المنطقة/الولاية',
            postcode: 'الرمز البريدي',
            country: 'الدولة',
        }
    },
    en: {
        pageTitle: "Where Am I? | Geolocation",
        mainTitle: "Where Am I?",
        subtitle: "Press the button to get your physical address easily.",
        getLocationBtn: "Get My Address Now",
        cardTitle: "Your Current Address",
        copyBtn: "Copy Address",
        copyFeedback: "Copied successfully!",
        copyFail: "Copy failed!",
        errorBrowser: "Geolocation is not supported by this browser.",
        errorFetch: "Error fetching the address.",
        errorPermission: "You denied the location request. Please allow access to continue.",
        errorPosition: "Location information is currently unavailable.",
        errorTimeout: "The request to get user location timed out. Please try again.",
        errorUnknown: "An unknown error occurred.",
        addressLabels: {
            road: 'Road',
            house_number: 'House Number',
            suburb: 'Suburb',
            city: 'City',
            state: 'State/Region',
            postcode: 'Postal Code',
            country: 'Country',
        }
    }
};

function switchLanguage(lang) {
    if (!['ar', 'en'].includes(lang)) return;

    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update buttons state
    langButtons.ar.classList.toggle('active', lang === 'ar');
    langButtons.en.classList.toggle('active', lang === 'en');

    // Update all text content
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // If an address is already displayed, re-render it in the new language
    if (Object.keys(currentAddress).length > 0) {
        displayAddress(currentAddress.ar, currentAddress.en);
    }
}

Object.keys(langButtons).forEach(lang => {
    langButtons[lang].addEventListener('click', () => switchLanguage(lang));
});


getLocationBtn.addEventListener('click', () => {
    addressCard.classList.add('hidden');
    errorDiv.classList.add('hidden');
    copyFeedback.classList.add('hidden');
    addressDetails.innerHTML = '';
    
    getLocationBtn.classList.add('hidden');
    loader.classList.remove('hidden');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    } else {
        showError({ message: translations[currentLang].errorBrowser });
    }
});

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const arUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ar&addressdetails=1`;
    const enUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en&addressdetails=1`;

    Promise.all([fetch(arUrl), fetch(enUrl)])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(([arData, enData]) => {
            if (arData && arData.address && enData && enData.address) {
                currentAddress = { ar: arData.address, en: enData.address };
                displayAddress(arData.address, enData.address);
                addressCard.classList.remove('hidden');
            } else {
                showError({ message: translations[currentLang].errorFetch });
            }
            resetUI();
        })
        .catch(err => {
            showError({ message: translations[currentLang].errorFetch });
            resetUI();
        });
}

function displayAddress(arAddress, enAddress) {
    addressDetails.innerHTML = '';
    const lang = currentLang;
    const labels = translations[lang].addressLabels;
    
    const addressMap = ['country', 'state', 'city', 'suburb', 'road', 'house_number', 'postcode'];

    addressMap.forEach(key => {
        const arValue = arAddress[key];
        const enValue = enAddress[key];

        if (arValue || enValue) {
            const div = document.createElement('div');
            div.className = 'address-item';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = `${labels[key]}:`;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'value';

            // Always show Arabic value if available
            if (arValue) {
                const arSpan = document.createElement('span');
                arSpan.className = 'lang-ar-val';
                arSpan.textContent = arValue;
                valueDiv.appendChild(arSpan);
            }
            
            // Always show English value if available
            if (enValue && enValue !== arValue) {
                const enSpan = document.createElement('span');
                enSpan.className = 'lang-en-val';
                enSpan.textContent = enValue;
                valueDiv.appendChild(enSpan);
            }
            
            div.appendChild(labelSpan);
            div.appendChild(valueDiv);
            addressDetails.appendChild(div);
        }
    });
}

function getFullAddressForCopy() {
    const lang = currentLang;
    const address = lang === 'ar' ? currentAddress.ar : currentAddress.en;
    if (!address) return '';

    const labels = translations[lang].addressLabels;
    const addressParts = [];
    const addressMap = ['country', 'state', 'city', 'suburb', 'road', 'house_number', 'postcode'];

    addressMap.forEach(key => {
        if (address[key]) {
            addressParts.push(`${labels[key]}: ${address[key]}`);
        }
    });
    
    return addressParts.join('\n');
}


function showError(error) {
    let errorMessage = translations[currentLang].errorUnknown;

    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = translations[currentLang].errorPermission;
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = translations[currentLang].errorPosition;
            break;
        case error.TIMEOUT:
            errorMessage = translations[currentLang].errorTimeout;
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
    const textToCopy = getFullAddressForCopy();
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        copyFeedback.textContent = translations[currentLang].copyFeedback;
        copyFeedback.classList.remove('hidden');
        setTimeout(() => copyFeedback.classList.add('hidden'), 2500);
    }).catch(err => {
        copyFeedback.textContent = translations[currentLang].copyFail;
        copyFeedback.style.color = 'var(--error-text)';
        copyFeedback.classList.remove('hidden');
         setTimeout(() => {
            copyFeedback.classList.add('hidden');
            copyFeedback.style.color = 'var(--success-color)';
        }, 2500);
    });
});

// Initialize with default language
switchLanguage(currentLang);