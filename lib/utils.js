// lib/utils.js
export const formatMoney = (n) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(n);
};

export const getGreeting = (name) => {
  const hour = new Date().getHours();
  let text = 'Halo';
  if (hour >= 4 && hour < 11) text = 'Selamat Pagi';
  else if (hour >= 11 && hour < 15) text = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) text = 'Selamat Sore';
  else text = 'Selamat Malam';
  return `${text}, ${name}`;
};

export const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
