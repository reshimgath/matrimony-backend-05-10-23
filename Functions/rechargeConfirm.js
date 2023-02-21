const nodemailer = require("nodemailer");

async function rechargeConfirm(email, plan, firstname, mydetails) {

  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "mailto:reshimgathvivah@gmail.com",
      pass: "xdicchueyeaoounh",
    },
  });
  let info = await transporter.sendMail({
    to: email,
    html: `<div class="letter_main_div">
    <h5 class="letter_p"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">Dear
        ${firstname}<br>
        Greeting From Reshimgath!
    </h5>
    <h5 class="letter_p h5"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">We are
        pleased to inform you that you have successfully opted for our<br>
        <span class="letter_span" style="color: brown;">${plan}</span>
    </h5>

    <h5 class="letter_p h5"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">We
        understand the importance of finding the perfect life partner and we
        are committed to providing you with the best possible experience on our
        platform. The ${plan} package offers you access to a wide range of features
        and benefits that will help you in your search for your soulmate.</h5>
    <h5 class="letter_p h5"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">Some of
        the key features of the ${plan} package include, <br>

        ${mydetails.map((val) => {
      `<span>${val}</span>`
    })}
    </h5>
    <h5 class="letter_p"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">We believe
        that these features will greatly enhance your experience and
        increase your chances of finding your ideal partner.</h5>
    <h5 class="letter_p"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">If you
        have any questions or need assistance, please do not hesitate to
        contact us. Our customer support team is available 24/7 to assist you.</h5>
    <h5 class="letter_p"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">Thank you
        for choosing Reshimgath and we wish you all the best in your
        search for your perfect match.
    </h5>
    <h5 class="letter_p"
        style="text-align: justify; font: bolder; margin-top: 20px; padding-left: 10px; padding-right: 10px;">Warm
        regards,<br>
        Reshimgath Team</h5>
</div>`,
    subject: `Love is in the Air: Your Matrimony Account has been Recharged!`,
  });
}

module.exports = rechargeConfirm