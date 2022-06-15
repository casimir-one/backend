import { VERIFICATION_TOKEN_LIFETIME } from './../constants';

export const defaultHtmlMessageForConfirmRegistration = (confirmationCode) => `
<table role="“presentation”" width="100%" style="background-color:#f4f4f6;width:100%" cellspacing="“0”" cellpadding="“0”">
    <tbody>
      <tr>
        <td>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
            <tbody>
              <tr style="border-collapse:collapse">
                <td valign="top" style="padding:48px 0;margin:0">
                  <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;border-spacing:0px;width:600px">
                    <tbody>
                      <tr style="border-collapse:collapse">
                        <td align="left" style="margin:0;padding:67px 55px 56px;background-color:#ffffff;border-radius:24px">
                          <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;border-spacing:0px;width:100%">
                            <tbody>
                              <tr style="border-collapse:collapse">
                                <td align="left" style="margin:0;padding:0">
                                  <p style="margin-top:0px;margin-bottom:40px;font-size:32px;line-height:48px;color:#302e38;font-weight:bold;font-family:'CircularXXWeb-Bold',Helvetica,Arial">
                                    DEIP</p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="left" style="margin:0;padding:0">
                                  <p style="margin:0;padding:0;font-size: 24px;line-height:24px;color:#565365;font-weight: bold;margin-bottom:20px;font-family:CircularXXWeb-Book,Helvetica,Arial">Confirm your email address</p>
                                  <p style="margin:0;padding:0;font-size:16px;line-height:24px;color:#565365;font-weight:400;margin-bottom:20px;font-family:CircularXXWeb-Book,Helvetica,Arial">Please enter this confirmation code in the window where you started creating your account:</p>
                                  <p style="margin:0;padding:0;font-size: 28px;line-height:24px;/* color:#565365; */font-weight: bold;text-align: center;margin-bottom:20px;background-color: #f3f4f8;padding: 30px 0;font-family: monospace;letter-spacing: 10px;">${confirmationCode}</p>
                                  <p style="margin:0;padding:0;font-size:16px;line-height:24px;color:#565365;font-weight:400;margin-bottom:20px;font-family:CircularXXWeb-Book,Helvetica,Arial">
                                    This code is only for you. Please <b>don't share</b> it with others. Code expires in ${Math.floor(VERIFICATION_TOKEN_LIFETIME/1000/60)} minutes.</p>
                                  <p style="margin:0;padding:0;font-size:16px;line-height:24px;color:#565365;font-weight:400;margin-bottom:0px;font-family:CircularXXWeb-Book,Helvetica,Arial">If you didn't create an account, please ignore this message.</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
`

export const defaultMailOptionsForConfirmRegistration = ({
  email,
  confirmationCode,
  subject = 'Confirm your registration on DEIP portal'
}) => ({
  to: email,
  subject,
  html: defaultHtmlMessageForConfirmRegistration(confirmationCode)
});