export const playSound = (type) => {
    // Definisi Map Suara
    const sounds = {
        complete: '/sounds/complete.mp3',
        levelup: '/sounds/levelup.mp3',
        pop: '/sounds/pop.mp3',
        trash: '/sounds/trash.mp3',
        timer: '/sounds/timer.mp3',
    };

    const file = sounds[type];
    if (!file) return;

    // Play Sound (dengan Error Handling ringan)
    const audio = new Audio(file);
    audio.volume = 0.6; // Volume 60% agar tidak kaget
    
    // Reset waktu agar bisa di-spam (misal check task cepat)
    audio.currentTime = 0;
    
    audio.play().catch((e) => {
        // Silent error jika browser memblokir autoplay atau file tidak ada
        console.warn("Sound play prevented:", e);
    });
};