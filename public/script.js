// script.js

const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatMessages = document.getElementById('chatMessages');
const loadingIndicator = document.getElementById('loadingIndicator');

// Fungsi untuk menggulir pesan chat ke bawah
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Fungsi untuk menampilkan pesan di antarmuka chat, mendukung blok kode Markdown.
 * @param {string} message - Teks pesan, dapat mengandung blok kode Markdown (```lang\ncode\n```).
 * @param {'user' | 'ai'} sender - Pengirim pesan ('user' atau 'ai').
 */
function displayMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('ai-message');
    }

    // Regex untuk mendeteksi blok kode Markdown (```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message)) !== null) {
        // Tambahkan teks sebelum blok kode (jika ada)
        if (match.index > lastIndex) {
            const textPart = message.substring(lastIndex, match.index);
            const textNode = document.createElement('span'); // Gunakan span atau div untuk teks biasa
            textNode.textContent = textPart.trim();
            if (textNode.textContent) { // Hanya tambahkan jika ada konten teks
                messageDiv.appendChild(textNode);
            }
        }

        // Tangani blok kode
        const lang = match[1] || ''; // Bahasa, opsional
        const codeContent = match[2].trim();

        const codeContainer = document.createElement('div');
        codeContainer.classList.add('code-block-container');

        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.textContent = codeContent; // Set textContent untuk keamanan
        // Optional: Add class for syntax highlighting if you integrate a library later
        // if (lang) {
        //     codeElement.classList.add(`language-${lang}`);
        // }

        preElement.appendChild(codeElement);
        codeContainer.appendChild(preElement);

        // Tambahkan tombol salin
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.textContent = 'Salin';
        copyButton.title = 'Salin kode ke papan klip';

        copyButton.addEventListener('click', () => {
            const textToCopy = codeContent;
            // Fallback for document.execCommand('copy') as navigator.clipboard.writeText() might not work in iframes
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                copyButton.textContent = 'Disalin!';
                setTimeout(() => {
                    copyButton.textContent = 'Salin';
                }, 2000); // Reset text after 2 seconds
            } catch (err) {
                console.error('Gagal menyalin:', err);
                copyButton.textContent = 'Gagal Salin!';
            }
            document.body.removeChild(textarea);
        });

        codeContainer.appendChild(copyButton);
        messageDiv.appendChild(codeContainer);

        lastIndex = codeBlockRegex.lastIndex;
    }

    // Tambahkan sisa teks setelah blok kode terakhir (jika ada)
    if (lastIndex < message.length) {
        const textPart = message.substring(lastIndex);
        const textNode = document.createElement('span');
        textNode.textContent = textPart.trim();
        if (textNode.textContent) {
            messageDiv.appendChild(textNode);
        }
    }

    // Pastikan jika tidak ada blok kode, pesan tetap ditampilkan sebagai teks biasa
    if (!messageDiv.hasChildNodes() && message.trim() !== '') {
        const textNode = document.createElement('span');
        textNode.textContent = message.trim();
        messageDiv.appendChild(textNode);
    }


    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}


// Tangani pengiriman formulir
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah pengiriman formulir default

    const message = userInput.value.trim();
    if (message === '') return; // Jangan kirim pesan kosong

    displayMessage(message, 'user'); // Tampilkan pesan pengguna segera
    userInput.value = ''; // Hapus input field
    loadingIndicator.style.display = 'block'; // Tampilkan indikator loading
    scrollToBottom();

    try {
        // Kirim input pengguna ke backend via POST /api/chat
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message }) // Kirim pesan sebagai JSON
        });

        if (!response.ok) {
            // Tangani kesalahan HTTP
            const errorData = await response.json();
            throw new Error(errorData.error || `Kesalahan HTTP! status: ${response.status}`);
        }

        const data = await response.json(); // Parsing respons JSON
        console.log('Data respons backend:', data); // Log respons lengkap untuk debugging

        // Periksa apakah properti 'reply' ada, yang dikirim oleh backend Anda
        if (data && data.reply) {
            displayMessage(data.reply, 'ai'); // Tampilkan respons AI menggunakan properti 'reply'
        } else {
            console.error('Respons backend tidak mengandung properti "reply":', data);
            displayMessage('Maaf, respons AI tidak dalam format yang diharapkan. Periksa konsol untuk detailnya.', 'ai');
        }

    } catch (error) {
        console.error('Kesalahan saat mengirim pesan ke backend:', error);
        displayMessage('Maaf, ada yang tidak beres. Silakan coba lagi. Periksa konsol browser untuk detail lebih lanjut.', 'ai'); // Tampilkan pesan kesalahan kepada pengguna
    } finally {
        loadingIndicator.style.display = 'none'; // Sembunyikan indikator loading
        scrollToBottom();
    }
});

// Gulir ke bawah saat pemuatan awal
window.onload = scrollToBottom;
