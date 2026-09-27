document.addEventListener('DOMContentLoaded', () => {
  loadAvailableSlots();
});

async function loadAvailableSlots() {
  const container = document.getElementById('games-list');

  if (!container) {
    console.error("Error: Element with ID 'games-list' not found in HTML.");
    return;
  }

  try {
    // Add timestamp query parameter to bypass browser caching
    const res = await fetch('/api/games?t=' + new Date().getTime());
    const games = await res.json();

    if (!games || games.length === 0) {
      container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No gaming slots available right now. Please check back later!</p>';
      return;
    }

    container.innerHTML = games.map(game => `
      <div class="card">
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <p><strong>Duration:</strong> ${game.duration} mins</p>
        <p><strong>Slot Time:</strong> ${new Date(game.slotTime).toLocaleString()}</p>
        <p class="price">₹${game.price}</p>
        <button class="btn-book" onclick="bookSlot('${game._id}', ${game.price})">Book Now</button>
      </div>
    `).join('');

  } catch (err) {
    console.error('Failed to load slots:', err);
    container.innerHTML = '<p style="color: red; grid-column: 1 / -1; text-align: center;">Failed to connect to server. Ensure server.js is running.</p>';
  }
}

// Global booking handler
window.bookSlot = async function(gameId, amount) {
  // Mock User ID for testing if no auth session is active
  const userId = localStorage.getItem('userId') || '650000000000000000000001';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        gameId: gameId,
        amount: amount,
        paymentMethod: 'gpay'
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Slot booked successfully!');
      loadAvailableSlots(); // Refresh slot list immediately
    } else {
      alert(data.message || 'Failed to book slot.');
    }
  } catch (err) {
    console.error('Error booking slot:', err);
    alert('Server error occurred during booking.');
  }
};