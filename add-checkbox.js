const fs = require('fs');
const files = ['das-projekt.html', 'datenschutz.html', 'impressum.html', 'index.html', 'success.html', 'wissens-explorer.html', 'episoden.html'];
const checkboxHtml = `                        <div class="flex items-start mb-6">
                            <div class="flex items-center h-5">
                                <input id="datenschutz_contact" name="datenschutz_contact" type="checkbox" required
                                    class="w-4 h-4 bg-gray-900 border border-gray-600 rounded focus:ring-2 focus:ring-brand-accent-500">
                            </div>
                            <div class="ml-3 text-sm">
                                <label for="datenschutz_contact" class="font-medium text-brand-accent-400">Datenschutz zustimmen</label>
                                <p class="text-gray-400">Ich stimme zu, dass meine Daten zur Bearbeitung der Anfrage gesendet und verarbeitet werden. Weitere Informationen finden Sie in der <a href="/datenschutz.html" class="text-brand-accent-500 hover:underline" target="_blank">Datenschutzerklärung</a>.</p>
                            </div>
                        </div>
`;

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Add Checkbox
    if (!content.includes('id="datenschutz_contact"')) {
        content = content.replace(/(<div>\s*<button type="submit")/g, checkboxHtml + '$1');
    }
    
    // Fix isFormEmpty bug by excluding checkbox
    if (content.includes("contactModal.querySelectorAll('input, textarea')")) {
        content = content.replace(/contactModal\.querySelectorAll\('input, textarea'\)/g, "contactModal.querySelectorAll('input:not([type=\"checkbox\"]), textarea')");
    }
    
    fs.writeFileSync(file, content);
});
console.log('Update complete.');
