const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set in AWS Lambda environment variables
    const REPO = 'your-username/your-repo'; // Replace with your GitHub username and repo
    const FILE_PATH = 'schedule.json';
    const ADMIN_PASSWORD = 'your_secure_password'; // Replace with a secure password

    try {
        const body = JSON.parse(event.body);
        const { password, action, date, time, description, index } = body;

        if (password !== ADMIN_PASSWORD) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Ungültiges Passwort' })
            };
        }

        // Fetch current schedule.json from GitHub
        const response = await axios.get(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        const scheduleData = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
        const sha = response.data.sha;

        // Update schedule based on action
        if (action === 'add') {
            if (!date || !time || !description) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Datum, Uhrzeit und Beschreibung sind erforderlich' })
                };
            }
            scheduleData.schedule.push({ date, time, description });
        } else if (action === 'edit') {
            if (index < 0 || index >= scheduleData.schedule.length || !date || !time || !description) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Ungültiger Index oder fehlende Daten' })
                };
            }
            scheduleData.schedule[index] = { date, time, description };
        } else if (action === 'delete') {
            if (index < 0 || index >= scheduleData.schedule.length) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Ungültiger Index' })
                };
            }
            scheduleData.schedule.splice(index, 1);
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Ungültige Aktion' })
            };
        }

        // Update schedule.json on GitHub
        await axios.put(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
            message: `Update schedule.json - ${action}`,
            content: Buffer.from(JSON.stringify(scheduleData, null, 2)).toString('base64'),
            sha: sha
        }, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Erfolgreich aktualisiert' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Serverfehler' })
        };
    }
};
