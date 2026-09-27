createSlotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newSlot = {
    name: document.getElementById('slotName').value,
    description: document.getElementById('slotDesc').value,
    price: Number(document.getElementById('slotPrice').value),
    duration: Number(document.getElementById('slotDuration').value),
    slotTime: new Date(document.getElementById('slotTime').value).toISOString(),
    isBooked: false // Force explicit false on creation
  };

  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSlot)
    });

    if (res.ok) {
      alert('Gaming Slot Created Successfully!');
      createSlotForm.reset();
      loadAdminSlots();
    } else {
      alert('Failed to create slot.');
    }
  } catch (err) {
    console.error('Error creating slot:', err);
    alert('Server error while creating slot.');
  }
});