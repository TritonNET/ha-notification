class CustomHaNotification extends HTMLElement {
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

    _render() {
        if (this.content) return;

        this.attachShadow({ mode: 'open' });
        const card = document.createElement('ha-card');
        this.content = document.createElement('div');
        this.content.className = "card-content";

        // Style to ensure button width matches text box width
        const style = document.createElement('style');
        style.textContent = `
      .container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }
      ha-textfield {
        width: 100%;
      }
      ha-button {
        width: 100%;
        --mdc-theme-primary: var(--primary-color);
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;

        const container = document.createElement('div');
        container.className = "container";

        const textField = document.createElement('ha-textfield');
        textField.label = "Message";
        textField.id = "message-input";
        textField.outlined = true;

        const button = document.createElement('ha-button');
        button.raised = true;
        button.innerText = "Send";

        button.addEventListener('click', () => {
            const message = textField.value;
            const scriptEntity = this._config.notify[0].script;
            const title = this._config.notify[0].title || "Announcement";

            // Split 'script.name' into domain and service
            const [domain, service] = scriptEntity.split('.');

            this._hass.callService(domain, service, {
                title: title,
                message: message
            });

            // Feedback & Reset
            textField.value = '';
        });

        container.appendChild(textField);
        container.appendChild(button);
        card.appendChild(container);
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(card);
    }

    getCardSize() {
        return 2;
    }
}

customElements.define('tritonnet-ha-notification', CustomHaNotification);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "tritonnet-ha-notification",
    name: "TritonNET HA Notification Card",
    description: "A text notification card."
});