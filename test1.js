
const axios = require('axios').default;

const getAuthToken = async () => {
  const options = {
    method: 'POST',
    url: 'http://127.0.0.1:9081/auth/sign-in',
    headers: {
      Connection: 'keep-alive',
      'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
      DNT: '1',
      'sec-ch-ua-mobile': '?0',
      // Authorization: 'Bearer null',
      'deip-application': 'undefined',
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      'sec-ch-ua-platform': '"macOS"',
      Origin: 'http://localhost:8080',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      Referer: 'http://localhost:8080/',
      'Accept-Language': 'en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7'
    },
    // data: {
    //   username: '4c583bd4ff9a48d801ea71f2cad6fea123122cf7',
    //   secretSigHex: '0x726131273d99406bc16b5fc2da2d64300535f33d2455169c39e0e4f08f1a5c5319dfeab130384cf0c0e491e09fe9fc240f7df5e2c73bb388af5853747e357981'
    // }

    data: { // vedai admin
      secretSigHex: "0xb4681b51841345484482f63ee4285c615ccf38a0d507cd592a1f1e18c995df377dab70f432d72364e64d2fe4fd846547e29f40e183535638e840e8f508efac8d",
      username: "f4570242526c40994282dc8f6590421a1575a7dc"
    }
  };

  const result = await axios.request(options).then(function (response) {
    console.log(response.data);
    return response.data.data.jwtToken;
  }).catch(function (error) {
    console.error(error);
  });
  console.log('result', result)
  return result;
}


const sendCmd = async (cmd, url, jwt) => {
  const request = {
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${jwt}`
    },
    data: {
      envelope: {
        // PROTOCOL_CHAIN: 2,
        MESSAGE: JSON.stringify({ commands: [cmd] })
      }
    }
  }

  return axios(request)
    .then(function (response) { console.log(response) })
    .catch(function (error) { console.log(error.response); });
}

const testRequest = async () => {

  // const jwt = await getAuthToken();
  const jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImY0NTcwMjQyNTI2YzQwOTk0MjgyZGM4ZjY1OTA0MjFhMTU3NWE3ZGMiLCJwb3J0YWwiOiIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyIiwiaXNQb3J0YWxBZG1pbiI6dHJ1ZSwiZXhwIjoxNjU0MjU3NTIyLCJpYXQiOjE2NTQxNzExMjJ9.QVt9cbxL9-UApN3qxgBvMGXwqn_SwiCJ_O_eizrpoNg`;
  const url = "http://127.0.0.1:9081/auth/v2/import-dao";
  // const url = "https://backend.yuliyachykiliova.lol/auth/v2/import-dao";

  const params = [
    {  // import dao
      num: 56,
      payload: {
        entityId: "2a90a7ffa1cbb501442022f65843a1ab588773f1",
        authority: {
          "owner": {
            "auths": [{ "key": "8e8db1fa6b4a3ab38df3f4095b3eb1a1c18864003cfd27f037e79b0adbfc0b12", "weight": 1 }],
            "weight": 1
          }
        },
        attributes: [],
        roles: [],
        isTeamAccount: false,
        status: 2
      }
    },
  ];

  const buildCmd = ({ num, payload }) => ({
    CMD_NUM: num,
    CMD_PAYLOAD: JSON.stringify(payload)
  });

  for (const param of params) {
    const cmd = buildCmd(param);
    await sendCmd(cmd, url, jwt);
  }

  // await sendCmd()
}



testRequest().then(() => {
  console.log("Working")
}).catch(err => {
  console.log('error', err)
  process.exit(1)
})

// {
//   "_id" : ObjectId("629898adefe82afaf78f16c6"),
//   "contentType" : 20,
//   "authors" : [ 
//       "f4570242526c40994282dc8f6590421a1575a7dc"
//   ],
//   "references" : [ 
//       "b45214be5735c5bb7236dfa46e29f1269bf321c9"
//   ],
//   "foreignReferences" : [],
//   "projectId" : "95dd6af1ed6ce4d78d8e3f47ad7ade9ac4c8dcd2",
//   "teamId" : "57a5de4c64ca77fd0b573d50dc7ff0d410353251",
//   "folder" : "b006ffc4da1a6d23ead6340c",
//   "title" : " Created using mongodb for tests, may be buggy",
//   "hash" : "75f479537af53407b7b09139d586abbe52c10dc66d21e669de4ef4724a7d6e8e",
//   "algo" : "sha256",
//   "formatType" : 3,
//   "status" : 1,
//   "packageFiles" : [],
//   "jsonData" : {
//       "time" : 1653510900083.0,
//       "blocks" : [ 
//           {
//               "id" : "3hwBpKsfPa",
//               "type" : "paragraph",
//               "data" : {
//                   "text" : "Created using mongodb for tests, may be buggy"
//               }
//           }
//       ],
//       "version" : "2.24.3"
//   },
//   "portalId" : "2222222222222222222222222222222222222222",
//   "createdAt" : ISODate("2022-05-25T20:35:14.452Z"),
//   "updatedAt" : ISODate("2022-05-25T20:35:14.452Z"),
//   "__v" : 0
// }