document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipient = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;

  // Wait for user input and send email when "Send" button clicked
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        // Open Sent mailbox
        load_mailbox('sent')
    })
 });
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Load mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    //Loop over all emails to be displayed
    emails.forEach(email => {
      const element = document.createElement('div');
      element.className = 'email-entry';
      element.dataset.id = email.id;

      //Customize header depening on mailbox selected
      let header = '';
      if (mailbox === 'sent') {
        header = `<strong>To:</strong> ${email.recipients.join(', ')}`;
      } else {
        header = `<strong>From:</strong> ${email.sender}`;
      }

      element.innerHTML = `
        <span>${header}</span>
        <span> - ${email.subject}</span>
        <span style="float: right;">${email.timestamp}</span>
      `;

      if (email.read) {
        element.style.backgroundColor = '#f0f0f0';
      } else {
        element.style.backgroundColor = 'white';
        element.style.fontWeight = 'bold';
      }

      //Check if an email is clicked for detailed view
      element.addEventListener('click', () => {
        load_email(email.id, mailbox);
      })

      //Append element
      document.querySelector('#emails-view').appendChild(element);
    });
  });
}

function load_email(id, mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

   //Load email
   fetch(`/emails/${id}`)
   .then(response => response.json())
   .then(email => {

     //Show content of selected email
     if (mailbox != 'sent') {
      document.querySelector('#emails-view').innerHTML = `
        <div class="mail-actions">
          <button id="archive-button">${email.archived ? 'Unarchive' : 'Archive'}</button>
          <button id="reply-button">Reply</button>
        </div>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr>
        <p>${email.body.replace(/\n/g, '<br>')}</p>
      `;

      //Archive mail if button clicked
      document.querySelector('#archive-button').addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then(() => load_mailbox('inbox'));
      });

      //Open Compose view to reply message
      document.querySelector('#reply-button').addEventListener('click', () => {
      const quotedBody = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n> ${email.body.replace(/\n/g, '\n> ')}`;
      compose_email((mailbox === 'sent') ? email.recipients.join(', ') : email.sender, email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`, quotedBody)
      });
    }

     //Sent inbox should not diplay Archive button
     else {
      document.querySelector('#emails-view').innerHTML = `
        <div class="mail-actions">
          <button id="reply-button">Reply</button>
        </div>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr>
        <p>${email.body.replace(/\n/g, '<br>')}</p>
      `;

      //Open Compose view to reply message
      document.querySelector('#reply-button').addEventListener('click', () => {
        const quotedBody = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n> ${email.body.replace(/\n/g, '\n> ')}`;
        compose_email((mailbox === 'sent') ? email.recipients.join(', ') : email.sender, email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`, quotedBody)
      });
     }
   });

   //Mark email as read
   console.log("Mark as read");
   fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}