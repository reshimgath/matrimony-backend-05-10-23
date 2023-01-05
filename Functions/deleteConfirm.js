const nodemailer = require("nodemailer");

async function deleteConfirm(email, otp, firstname) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: "reshimgathvivah@gmail.com",
            pass: "xdicchueyeaoounh",
        },
    });
    let info = await transporter.sendMail({
        to: email,
        html: `  <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2;">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #e12e56">
            <a href="" style="font-size:1.4em;color: #e12e56;text-decoration:none;font-weight:600">Reshimgath</a>
          </div>
          <p style="font-size:1.1em">Hi ${firstname},</p>
          <p>Congratulations! You are just one step away from getting your desired
          life partner.</p>
      
          <p>Thank you for Registration. Use the following OTP to complete your Sign Up procedures. OTP is valid for 3 minutes.do not share with anyone.</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
          <p style="font-size:0.9em;">Regards,<br />Team Reshimgath</p>
          <hr style="border:none;border-top:1px solid #e12e56" />
          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
            <p>Reshimgath</p>
            <p>some adress</p>
            <p>Kolhapur</p>
          </div>
        </div>
        <div>
        <ul style="display:flex;gap:10px;list-style-type:none">
        <li>8080579640 </li>
        <li>9209298685</li>
        <li>reshimgathmatrimony141@gmail.com</li>
        <li>Website</li>
        </ul>
      </div>
      </div>
      </div>`,
        subject: `Reshimgath Delete Password`,
    });
}

module.exports = deleteConfirm