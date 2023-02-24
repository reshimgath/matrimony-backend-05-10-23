const nodemailer = require("nodemailer");

async function mailSender(email, firstname, password) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      // user: "mailto:muchmarklbh@gmail.com",
      // pass: "dzlmziluuzxgrhyl"
      user: "mailto:reshimgathvivah@gmail.com",
      // pass: "Boss@123"
      // pass: "xdicchueyeaoounh",
      pass: "fwzayylmysxporlx"
    },
  });
  let info = await transporter.sendMail({
    to: email,
    html: ` <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2;">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #e12e56">
        <a href="" style="font-size:1.4em;color: #e12e56;text-decoration:none;font-weight:600">Reshimgath</a>
      </div>
      <p style="font-size:1.1em">Hi ${firstname},</p>
      <p>This email is to inform you that a new password has been generated for your account associated with Reshimgath We recommend that you change this password immediately upon logging in to ensure the security of your account.</p>
  
      <p>If you did not request a new password, please contact our support team immediately. It is possible that your account has been compromised and we need to take steps to secure it.
  
      Thank you for choosing Reshimgath as your online platform. If you have any questions or concerns, please do not hesitate to contact us.</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${password}</h2>
      <p style="font-size:0.9em;">Regards,<br />Team Reshimgath</p>
      <hr style="border:none;border-top:1px solid #e12e56" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>Reshimgath vivah</p>
        <p>Station Road, Kolhapur.</p>
        <p>Kolhapur</p>
      </div>
    </div>
    <div>
    <ul style="display:flex;gap:10px;list-style-type:none">
    <li>+91 8080579640 </li>
    <mailto:li>reshimgathmatrimony141@gmail.com</li>
    <li>Website</li>
    </ul>
  </div>
  </div>
  </div>`,
    subject: `Reshimgath One Time Password`,
  });
}

module.exports = mailSender