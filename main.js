import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Deactivate all links and sections
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      
      // Activate clicked link and corresponding section
      link.classList.add('active');
      const sectionId = link.getAttribute('href').substring(1);
      document.getElementById(sectionId).classList.add('active');
    });
  });

  // Dynamically generate sections based on config
  const navSections = config.navSections;
  const navContainer = document.querySelector('.nav .win98-content');
  
  // Activate first link by default
  if (navLinks.length > 0) {
    navLinks[0].classList.add('active');
    const firstSectionId = navLinks[0].getAttribute('href').substring(1);
    document.getElementById(firstSectionId).classList.add('active');
  }
  
  // Setup audio player
  setupAudioPlayer();
  
  // Setup click sounds
  setupClickSounds();
  
  // Setup hover sounds
  setupHoverSounds();
  
  // Setup ambient sound
  setupAmbientSound();
  
  // Banner image rotation
  setupBannerRotation();
  
  // Add background crossfade setup
  setupBackgroundCrossfade();
  
  // Add section height adjustment
  adjustContentHeight();
  
  // Setup image lightbox
  setupImageLightbox();
  
  // Setup secret section functionality
  setupSecretSection();
  
  // Setup unreleased tracks link functionality
  setupUnreleasedTracksLink();
});

function setupAmbientSound() {
  const ambientAudio = new Audio('jungle_amb.mp3');
  ambientAudio.loop = true;
  ambientAudio.volume = 0.1; // Very low volume
  
  // Play ambient sound after user interaction
  const enableAmbientSound = () => {
    ambientAudio.play().catch(error => {
      console.log('Ambient sound autoplay failed:', error);
    });
    
    // Remove the event listener after first interaction
    document.removeEventListener('click', enableAmbientSound);
  };
  
  document.addEventListener('click', enableAmbientSound);
}

function setupAudioPlayer() {
  const audioPlayer = document.getElementById('audio-player');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const songTitle = document.getElementById('song-title');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const vuMeterBars = document.querySelectorAll('.vu-meter-bar');
  
  // Audio context and analyzer setup
  let audioContext;
  let analyser;
  let audioSource;
  let dataArray;
  const frequencyBands = 5; // Match the number of columns in the VU meter
  
  // Initialize audio analyser
  function initAudioAnalyser() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6; // Reduced from 0.8 for more responsiveness
      
      audioSource = audioContext.createMediaElementSource(audioPlayer);
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
      
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
  }
  
  const playlist = [
    { file: 'Reload - 4-4 Rhodes.mp3', title: 'Reload - 4-4 Rhodes' },
    { file: 'Vesna - F-Lower.mp3', title: 'Vesna - F-Lower' },
    { file: 'Guardians Of Dalliance - Curious.mp3', title: 'Guardians Of Dalliance - Curious' },
    { file: 'shinichi atobe - the red line.mp3', title: 'Shinichi Atobe - The Red Line' }
  ];
  
  let currentTrackIndex = 0;
  let isPlaying = false;
  
  playBtn.textContent = 'Play';
  prevBtn.textContent = '<';
  nextBtn.textContent = '>';
  
  // Function to get a random track
  function getRandomTrack() {
    return Math.floor(Math.random() * playlist.length);
  }
  
  // Function to load and play a track
  function loadTrack(index) {
    currentTrackIndex = index;
    audioPlayer.src = playlist[currentTrackIndex].file;
    songTitle.textContent = playlist[currentTrackIndex].title;
    
    // Attempt to play the track
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
        })
        .catch(error => {
          console.log('Autoplay was prevented:', error);
          isPlaying = false;
        });
    }
  }
  
  // Function to extend playlist
  function extendPlaylist(newTracks) {
    newTracks.forEach(track => {
      playlist.push(track);
    });
    
    // Optional: Optionally reset current track or shuffle
    currentTrackIndex = playlist.length - 1;
    loadTrack(currentTrackIndex);
  }
  
  setupAudioPlayer.extendPlaylist = extendPlaylist;
  
  // Play/Pause toggle
  playBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
      const playPromise = audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Initialize audio analyzer if not already done
            if (!audioContext) {
              initAudioAnalyser();
            } else if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
            
            playBtn.textContent = 'Pause';
            isPlaying = true;
            updateVUMeter();
          })
          .catch(error => {
            console.log('Autoplay was prevented:', error);
            playBtn.textContent = 'Play';
            isPlaying = false;
          });
      }
    } else {
      audioPlayer.pause();
      playBtn.textContent = 'Play';
      isPlaying = false;
      
      // Suspend audio context to save resources
      if (audioContext && audioContext.state === 'running') {
        audioContext.suspend();
      }
    }
  });
  
  // Previous track
  prevBtn.addEventListener('click', () => {
    loadTrack(currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1);
  });
  
  // Next track
  nextBtn.addEventListener('click', () => {
    loadTrack(currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0);
  });
  
  // Volume control with sound
  const turnSound = new Audio('turn.wav');
  volumeSlider.addEventListener('input', () => {
    // Round to nearest 0.1 step
    const volume = Math.round(volumeSlider.value * 10) / 10;
    audioPlayer.volume = volume;
    volumeSlider.value = volume; // Ensure slider shows exact stepped value
    
    // Randomize pitch
    turnSound.playbackRate = 0.8 + Math.random() * 0.4; // Pitch between 0.8 and 1.2
    
    // Lower overall volume of turn sound
    turnSound.volume = 0.5; // Half the original volume
    
    // Play turn sound when slider is moved
    turnSound.currentTime = 0; // Reset sound to start
    turnSound.play().catch(error => {
      console.log('Turn sound playback failed:', error);
    });
  });
  
  // Auto-advance to a random track when current one ends
  audioPlayer.addEventListener('ended', () => {
    let newIndex;
    do {
      newIndex = getRandomTrack();
    } while (newIndex === currentTrackIndex);
    
    loadTrack(newIndex);
  });
  
  // Update VU meter based on actual audio frequencies
  function updateVUMeter() {
    if (!audioContext || audioPlayer.paused) {
      // Reset VU meter when paused
      document.querySelectorAll('.vu-meter-bar').forEach(bar => {
        bar.classList.remove('active', 'peak', 'max');
      });
      return;
    }
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Divide the frequency spectrum into bands
    const bandSize = Math.floor(dataArray.length / frequencyBands);
    
    // Update each column of the VU meter
    const vuMeterColumns = document.querySelectorAll('.vu-meter-column');
    vuMeterColumns.forEach((column, columnIndex) => {
      // Calculate average value for this frequency band
      const startIndex = columnIndex * bandSize;
      const endIndex = startIndex + bandSize;
      let sum = 0;
      
      for (let i = startIndex; i < endIndex; i++) {
        sum += dataArray[i];
      }
      
      // Normalize to 0-1 range
      const average = sum / bandSize / 255;
      
      // Apply enhanced sensitivity and more aggressive weighting
      // Lower frequencies (left columns) tend to have more energy
      const columnWeight = 1.5 - (columnIndex * 0.15); // Increased weight and made difference more pronounced
      const sensitivity = 1.8; // Increased sensitivity multiplier
      const weightedValue = Math.min(1, average * columnWeight * sensitivity); // Cap at 1 to avoid overflow
      
      const bars = column.querySelectorAll('.vu-meter-bar');
      const activeBarCount = Math.ceil(weightedValue * bars.length); // Use ceil instead of floor for more activity
      
      bars.forEach((bar, index) => {
        bar.classList.remove('active', 'peak', 'max');
        
        if (index < activeBarCount) {
          if (index > bars.length * 0.8) {
            bar.classList.add('max');
          } else if (index > bars.length * 0.5) { // Changed from 0.6 to 0.5 to get more "peak" indicators
            bar.classList.add('peak');
          } else {
            bar.classList.add('active');
          }
        }
      });
    });
    
    // Request next frame update if still playing
    if (!audioPlayer.paused) {
      requestAnimationFrame(updateVUMeter);
    }
  }
  
  // Update time display
  audioPlayer.addEventListener('timeupdate', () => {
    // Update current time
    const currentMinutes = Math.floor(audioPlayer.currentTime / 60);
    const currentSeconds = Math.floor(audioPlayer.currentTime % 60).toString().padStart(2, '0');
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
  });
  
  // Set total time when metadata is loaded
  audioPlayer.addEventListener('loadedmetadata', () => {
    const totalMinutes = Math.floor(audioPlayer.duration / 60);
    const totalSeconds = Math.floor(audioPlayer.duration % 60).toString().padStart(2, '0');
    totalTimeEl.textContent = `${totalMinutes}:${totalSeconds}`;
  });
  
  // Start with a random track and attempt to play
  const initialTrack = getRandomTrack();
  loadTrack(initialTrack);
  audioPlayer.volume = volumeSlider.value;

  // Set default volume to a stepped value
  audioPlayer.volume = 0.2;
  volumeSlider.value = 0.2;
  
  // Add user interaction listener to enable audio
  document.addEventListener('click', enableAudio, { once: true });

  function enableAudio() {
    audioPlayer.play().catch(error => {
      console.log('Initial autoplay failed:', error);
    });
    
    // Initialize audio analyzer
    if (window.AudioContext || window.webkitAudioContext) {
      initAudioAnalyser();
      updateVUMeter();
    }
  }
}

function setupClickSounds() {
  const clickSound = new Audio('click.wav');
  
  // Function to play the click sound
  function playClickSound() {
    clickSound.currentTime = 0; // Reset sound to start
    clickSound.play().catch(error => {
      console.log('Click sound playback failed:', error);
    });
  }
  
  // Add event listeners to buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', playClickSound);
  });
  
  // Add event listeners to nav links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', playClickSound);
  });
}

function setupHoverSounds() {
  const hoverSound = new Audio('hover.wav');
  hoverSound.preload = 'auto';
  
  // Function to play the hover sound
  function playHoverSound() {
    hoverSound.currentTime = 0; // Reset sound to start
    hoverSound.play().catch(error => {
      console.log('Hover sound playback failed:', error);
    });
  }
  
  // Add event listeners to buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mouseover', playHoverSound);
  });
  
  // Add event listeners to nav links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('mouseover', playHoverSound);
  });
}

function setupBannerRotation() {
  const bannerImage = document.querySelector('.banner img');
  const bannerContainer = document.querySelector('.banner .win98-content');
  
  // Set the cropped waterfall GIF
  bannerImage.src = 'cropped_properly_final.gif';
  
  // Set initial container size
  const initialImage = new Image();
  initialImage.src = bannerImage.src;
  initialImage.onload = () => {
    // Store the original dimensions
    const initialHeight = bannerContainer.offsetHeight;
    const initialWidth = bannerContainer.offsetWidth;
    
    // Fix banner container size
    bannerContainer.style.height = `${initialHeight}px`;
    bannerContainer.style.width = `${initialWidth}px`;
  };
}

function setupBackgroundCrossfade() {
  const body = document.body;
  const backgroundInterval = 10000; // 10 seconds between crossfades

  function crossfadeBackground() {
    body.classList.toggle('crossfade');
  }

  // Start initial crossfade cycle
  setInterval(crossfadeBackground, backgroundInterval);
}

function adjustContentHeight() {
  const contentWindow = document.querySelector('.win98-window.content');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  // Function to adjust height based on active section
  function updateContentHeight() {
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
      const contentHeight = activeSection.scrollHeight;
      contentWindow.style.height = contentHeight + 40 + 'px'; // Add padding + titlebar height
    }
  }
  
  // Initial adjustment
  updateContentHeight();
  
  // Adjust height when section changes
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      updateContentHeight(); // Immediate update without timeout
    });
  });
  
  // Add mutation observer to detect content changes
  const contentObserver = new MutationObserver(updateContentHeight);
  document.querySelectorAll('.section').forEach(section => {
    contentObserver.observe(section, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      characterData: true 
    });
  });
  
  // Update on window resize
  window.addEventListener('resize', updateContentHeight);
}

function setupImageLightbox() {
  // Check if the cars section exists before trying to access it
  const carSection = document.getElementById('cars');
  if (!carSection) return; // Exit function if section doesn't exist
  
  const fiatImage = carSection.querySelector('img[alt="Fiat Coupe"]');
  
  // Create lightbox container
  const lightbox = document.createElement('div');
  lightbox.classList.add('image-lightbox');
  
  // Create lightbox image
  const lightboxImage = document.createElement('img');
  lightboxImage.src = fiatImage.src;
  lightboxImage.alt = fiatImage.alt;
  
  // Add image to lightbox
  lightbox.appendChild(lightboxImage);
  
  // Add lightbox to body
  document.body.appendChild(lightbox);
  
  // Click event on original image
  fiatImage.addEventListener('click', () => {
    lightbox.classList.add('active');
    
    // Play click sound
    const clickSound = new Audio('click.wav');
    clickSound.play().catch(error => {
      console.log('Click sound playback failed:', error);
    });
  });
  
  // Click event on lightbox to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      
      // Play click sound
      const clickSound = new Audio('click.wav');
      clickSound.play().catch(error => {
        console.log('Click sound playback failed:', error);
      });
    }
  });
}

function setupSecretSection() {
  const secretLink = document.querySelector('.secret-link');
  if (!secretLink) return;
  
  secretLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Deactivate all links and sections
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Activate secret section
    document.getElementById('secret-unreleased').classList.add('active');
    
    // Play click sound
    const clickSound = new Audio('click.wav');
    clickSound.play().catch(error => {
      console.log('Click sound playback failed:', error);
    });
  });
}

function setupUnreleasedTracksLink() {
  const unreleasedTracksLink = document.querySelector('.unreleased-tracks-link');
  if (!unreleasedTracksLink) return;
  
  unreleasedTracksLink.addEventListener('click', () => {
    // Play insert sound
    const insertSound = new Audio('click.wav'); // Reusing the click sound, change if needed
    insertSound.play().catch(error => {
      console.log('Insert sound playback failed:', error);
    });
    
    // Safely access additionalPlaylists, using optional chaining
    const unreleasedTracks = config?.additionalPlaylists?.unreleased || [];
    
    // Extend playlist with new tracks
    if (typeof setupAudioPlayer.extendPlaylist === 'function') {
      setupAudioPlayer.extendPlaylist(unreleasedTracks);
    } else {
      // Fallback method to add tracks directly
      unreleasedTracks.forEach(track => {
        const playlist = [
          { file: 'Reload - 4-4 Rhodes.mp3', title: 'Reload - 4-4 Rhodes' },
          { file: 'Vesna - F-Lower.mp3', title: 'Vesna - F-Lower' },
          { file: 'Guardians Of Dalliance - Curious.mp3', title: 'Guardians Of Dalliance - Curious' },
          { file: 'shinichi atobe - the red line.mp3', title: 'Shinichi Atobe - The Red Line' }
        ];
        playlist.push(track);
      });
    }
    
    // Update link appearance
    unreleasedTracksLink.textContent = 'tracks added to the playlist, use the media player to scroll through.';
    unreleasedTracksLink.style.color = '#bfbfbf'; // Dark grey color
    unreleasedTracksLink.style.pointerEvents = 'none';
  });
}