class TritonNetHaNotification extends HTMLElement {
    set hass(hass) {
        this._hass = hass;
    }

    setConfig(config) {
        if (!config.notify || !config.notify[0] || !config.notify[0].script) {
            throw new Error("Invalid Configuration: notify[0].script is required.");
        }
        this._config = config;
        this._render();
    }

    async _sendNotification(textField) {
        const message = textField.value.trim();
        if (!message) return;

        const scriptEntity = this._config.notify[0].script;
        let finalTitle = this._config.notify[0].title || "Announcement";

        // Only perform replacement if {user} is present in the title
        if (finalTitle.includes("{user}")) {
            const userName = this._hass.user ? this._hass.user.name : "Admin";
            finalTitle = finalTitle.replace(/{user}/g, userName);
        }

        const [domain, service] = scriptEntity.split('.');

        try {
            // Call service and await success
            await this._hass.callService(domain, service, {
                title: finalTitle,
                message: message
            });

            // Clear the text box ONLY after successful script trigger
            textField.value = '';
        } catch (e) {
            console.error("Failed to trigger notification script:", e);
            // Text remains in the box if the service call fails
        }
    }

    _render() {
        if (this.content) return;

        this.attachShadow({ mode: 'open' });
        const card = document.createElement('ha-card');

        const style = document.createElement('style');
        style.textContent = `
      .container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }
      ha-textfield {
        display: block;
        width: 100%;
        /* Ensures the label/placeholder has full room to prevent "Mess..." truncation */
        --mdc-text-field-label-ink-color: var(--secondary-text-color);
      }
      ha-button {
        display: block;
        width: 100%;
        height: 50px;
        --mdc-theme-primary: var(--primary-color);
        --mdc-button-horizontal-padding: 0px;
      }
    `;

        const container = document.createElement('div');
        container.className = "container";

        const textField = document.createElement('ha-textfield');
        // We use label instead of placeholder to prevent truncation in narrow cards
        textField.label = "Type message here...";
        textField.id = "message-input";
        textField.outlined = true;

        const button = document.createElement('ha-button');
        button.raised = true;
        button.innerText = "Send Announcement";

        button.addEventListener('click', () => this._sendNotification(textField));

        // Support for hitting Enter to send
        textField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._sendNotification(textField);
            }
        });

        container.appendChild(textField);
        container.appendChild(button);
        card.appendChild(container);
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(card);
        this.content = container;
    }

    getCardSize() {
        return 2;
    }
}

customElements.define('tritonnet-ha-notification', TritonNetHaNotification);

// Add to card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: "tritonnet-ha-notification",
    name: "TritonNet Notification Card",
    preview: true,
    description: "A styled text box and button for triggering house-wide scripts with user identification."
});