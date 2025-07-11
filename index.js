console.log("hyerim");

import express from "express";
import cors from "cors";
import path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import serverless from "serverless-http";

const app = express();
// cors 설정:  포트가 아니라 서버주소로
//app.use(cors());
// cors 이슈 해결
const corsOption = {
  origin: "https://shiny-pasca-37f353.netlify.app", // 프론트엔드 배포 주소
  credential: true,
};
app.use(cors(corsOption));

//env 설정
const __dirname = path.resolve();
dotenv.config({ path: __dirname + "/.env" });

//프론트에서 받은 json 형태의 데이터를 객체로 파싱하여 사용
app.use(express.json({ type: "*/*" }));
app.use(express.urlencoded({ extended: true }));

// openai 정보 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log(process.env.OPENAI_API_KEY);

// 챗봇 api설정
const initialMessage = (ingredientList) => {
  return [
    {
      role: "system",
      content: `당신은 "맛있는 쉐프"라는 이름의 전문 요리사입니다. 사용자가 재료 목록을 제공하면, 첫번째 답변에서는 오직 다음 문장만을 응답으로 제공해야 합니다. 다른 어떤 정보도 추가하지 마세요: 제공해주신 재료 목록을 보니 정말 맛있는 요리를 만들 수 있을 것 같아요. 어떤 종류의 요리를 선호하시나요? 간단한 한끼 식사, 특별한 저녁 메뉴, 아니면 가벼운 간식 등 구체적인 선호도가 있으시다면 말씀해 주세요. 그에 맞춰 최고의 레시피를 제안해 드리겠습니다!`,
    },
    {
      role: "user",
      content: `안녕하세요, 맛있는 쉐프님. 제가 가진 재료로 요리를 하고 싶은데 도와주실 수 있나요? 제 냉장고에 있는 재료들은 다음과 같아요: ${ingredientList
        .map((item) => item.value)
        .join(", ")}`,
    },
  ];
};

// 초기 답변
app.post("/recipe", async (req, res) => {
  const { ingredientList } = req.body;
  const messages = initialMessage(ingredientList); //사용자로부터 재료목록을 받아옴
  try {
    //OpenAI에게 요청을 보냄
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages, //key = value 같다면 하나로 축약가능
      temperature: 1,
      max_tokens: 4000,
      top_p: 1,
    });
    const data = [...messages, response.choices[0].message];
    console.log("data", data);
    res.json({ data });
  } catch (error) {
    console.log(error);
  }
});

// 유저와의 채팅
app.post("/message", async function (req, res) {
  const { userMessage, messages } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [...messages, userMessage], //기존메세지와 현재 입력한 메세지가지 한꺼번에 보낸다.그래서 이전 기억으로 대화가 가능
      temperature: 1,
      max_tokens: 4000,
      top_p: 1,
    });
    const data = response.choices[0].message;
    res.json({ data });
  } catch (error) {
    console.log(error);
  }
});

const port = process.env.PORT || 8081;

// app.listen(8081, () => {
//   console.log("port", port);
// });

// app.listen(port);
export const handler = serverless(app);
