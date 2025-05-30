

const canvas = document.getElementById("pokeCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const pokeballs = [];

for (let i = 0; i < 30; i++) {
    pokeballs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 15 + 5,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
    });
}

function drawPokeball(x, y, radius, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    
    // Draw the Pokéball
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI, true);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI, false);
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();

    ctx.restore();
}

function animatePokeballs() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let pokeball of pokeballs) {
        drawPokeball(pokeball.x, pokeball.y, pokeball.radius, pokeball.rotation);

        // Update position
        pokeball.x += pokeball.speedX;
        pokeball.y += pokeball.speedY;
        pokeball.rotation += 0.5;

        // Wrap around the screen
        if (pokeball.x < 0) pokeball.x = canvas.width;
        if (pokeball.x > canvas.width) pokeball.x = 0;
        if (pokeball.y < 0) pokeball.y = canvas.height;
        if (pokeball.y > canvas.height) pokeball.y = 0;
    }

    requestAnimationFrame(animatePokeballs);
}

/* Function to change the background color based on the selected type
function changeBackgroundColor(type) {
    const colors = {
        default: "black",
        fire: "orange",
        water: "blue",
        grass: "green",
        electric: "yellow",
        psychic: "purple",
    };
    document.body.style.backgroundColor = colors[type] || colors.default;
}

// Event listener for the Pokémon type selector
pokemonTypeSelector.addEventListener("change", (event) => {
    const selectedType = event.target.value;
    changeBackgroundColor(selectedType);
});*/

animatePokeballs();








document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('inviteModal');
    const inviteTitle = document.getElementById('invite-title');
    const closeBtn = document.querySelector('.close-btn');

    const inviteButtons = document.querySelectorAll('.players-list button');

    inviteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const listItem = e.target.closest('li');
            const playerName = listItem.querySelector('span')?.textContent || "Jogador";
            inviteTitle.textContent = `Convite para ${playerName}`;
            modal.classList.remove('hidden');
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    menu.classList.toggle('visible');
    
    // Fechar o menu ao clicar fora dele
    if (menu.classList.contains('visible')) {
        document.addEventListener('click', closeMenuOnClickOutside);
    } else {
        document.removeEventListener('click', closeMenuOnClickOutside);
    }
}

function closeMenuOnClickOutside(e) {
    const menu = document.getElementById('settingsMenu');
    const icon = document.querySelector('.settings-icon');
    
    if (!menu.contains(e.target) && !icon.contains(e.target)) {
        menu.classList.remove('visible');
        document.removeEventListener('click', closeMenuOnClickOutside);
    }
}


function toggleProfileMenu() {
    const profileMenu = document.getElementById('profileMenu');
    profileMenu.classList.toggle('visible');
    
    // Fecha o menu de settings se estiver aberto
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenu.classList.contains('visible')) {
        settingsMenu.classList.remove('visible');
    }
    
    // Gerencia o clique fora do menu
    if (profileMenu.classList.contains('visible')) {
        document.addEventListener('click', closeProfileMenuOnClickOutside);
    } else {
        document.removeEventListener('click', closeProfileMenuOnClickOutside);
    }
}

function closeProfileMenuOnClickOutside(e) {
    const profileMenu = document.getElementById('profileMenu');
    const profileIcon = document.querySelector('.profile-icon');
    
    if (!profileMenu.contains(e.target) && !profileIcon.contains(e.target)) {
        profileMenu.classList.remove('visible');
        document.removeEventListener('click', closeProfileMenuOnClickOutside);
    }
}








