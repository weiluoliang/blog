---
title: LLM与Agent核心概念总结
description: AI知识常见的概念总结
date: 2026-07-11
tags: [LLM, Agent, Token,Skills]
order: 0
---

LLM是大脑，Agent的是手和脚 。

Agent提供了各种工具给LLM，让LLM有了执行命令 、请求网页 等能力。

claude 、GPT  、deepseek 属于大模型 ，claude code ，codex 、 openclaw 属于 Agent

## LLM的本质 ： 概率预测
大预言模型（LLM）的本质: 其实就是根据一段文本，预测下一个token出现的概率。

token是LLM处理的最小单元。通常一个英文单词就是一个token，一个汉字约等于 1~2个token。

比如你输入【今天的天气】，它会根据概率预测一个字 ，不断的循环，生成完成的一句话。

LLM为什么靠概率猜下一个字，却能给出很合理的回答？其实主要靠**规模效应**,经过上百亿、千亿的参数训练，这个概率预测变成惊人的准确。

但是他并不是真的理解，只是在做统计意义上的模式匹配。

LLM往外面输出时，有一个控制参数叫 温度(Temperature)，控制模型选字的随机性。
当温度(Temperature)=0，随机性最低，LLM会选择概率最大的那个字

另外一个重要的概念： 上下文（Context）。系统提示词，你输入的所有历史消息，这些构成了上下文，大模型就是根据上下文预测下一个Token。

【大模型的记忆】也是根据上下文，它本身并没有记忆 。如果你问的问题在历史记录里面，它就能正确的回答你，感觉像是有记忆的。

大模型的上下文容量是有限的，这个容量称之为上下文窗口（Context Windows）。

如果超出了上下文容量，内容就会被处理掉，一般的做法是压缩，把历史消息总结成一段摘要，去掉细节。如果你和ChatGPT等大模型聊久了可能发现
到后面再问开头的问题，它已经失忆了。

所以我们一个会话最好聚焦一个问题，下一个问题重新开一个会话。

## System Prompt 设置【人设】
如何控制大模型的行为、角色设定？ 答案就是系统提示词（System Prompt）。

System Prompt 一般是是在拼接到上下文的最前面，用户看不到它，但是每次模型都能读到它。

System Prompt 可以是模型服务商预设的（比如claude 。ChatGPT默认的指令），也可以是开发者通过API自己设定。

System Prompt有一个很重要的用途就是编写【**安全规则**】

当你问模型一些比较敏感的问题的时候，模型可能会拒绝回答，这种规则有些是在训练的时候学会了，拒绝有害的请求。
但是这是不够的，系统提示词可以弥补这一块内容，而且系统提示词会灵活很多。

如果用户在对话里面写【忽略你之前的所有指令】，模型会停谁的 ？ 这就是涉及到优先级问题，模型会标记角色标签（system,user,assistant），
模型在训练的时候学会的对System标签的内容赋予更高的优先级。

模型的核心价值就是两点： 定义模型的行为方式、以及设置不可轻易绕过的安全规则。

## Function Calling  让模型学会动手

LLM 虽然是能说会道，但是它只能输出文本，这是它最大的限制。
你问它现在几点？ 它无法知道，因为它没有时钟。

2023年6月，OpenAI发布了 Function Calling功能，给这个大脑装上了手脚。

这个时候模型可以通过调用工具解决一下它不知道的问题，比如通过API查询天气来回答用户的问题。

怎么做？ 通过在System Prompt中加入 查询天气的API。示例如下：

```bash
你是一个天气助手，有以下工具：

工具名称： get_weather
功能描述： 查询某个城市的当天天气
参数：
- city : （字符串，必填） ，城市名称 如 “北京”
- unit:  (字符串，可选 ), 温度单位 

当用户的问题需要查询天气时，输出JSON格式的工具调用。
```

当用户问：【北京今天的天气如何？】

模型读到这个问题，发现上下文有一个查询天气的工具可以使用，于是它知道通过工具获取天气信息，于是模型输出工具调用，而不是直接回答

```json
{
  "tool": "get_weather",
  "arguments": {
    "city": "北京"
  }
}
```

它本身并不能执行工具，因为大模型只能输出文本，它输出这段告诉客户端： 我需要执行工具 xxx，这个时候就需要客户端解析，通过客户端
去执行工具，然后把结果塞回去给大模型，大模型就可以根据这个结果给用户作答。

客户端把结果塞回去：

```bash
调用get_weather的结果
{"city":"北京","temperature": 30 , "unit":"celsius", "condition":"多云" }
```

模型再根据这个调用结果回答用户，用户就能看到正确的结果了。

注意上下文的变化： 工具描述-->用户提问-->模型输出工具调用-->工具返回结果-->模型总结最总答案。

**一切都是上下文，没什么魔法**。 模型通过上下文知道有 get_weather工具。

Function Calling的实现依赖于模型的指令遵从能力，你让它输出JSON，它是否能老老实实的输出JSON.

早期的模型其实遵从能力很差，你叫它输出JSON，可能它会顺带输出 好的，以下是JSON内容 等。

随着大模型的迭代，Function Calling能力越来越强，名称从`Functions`改为 `Tools`。

## MCP: 给模型定个标准

Function Calling解决了工具调用的问题，但是每个厂商的格式可能不太一样

```bash
# openai 
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "查询指定城市的当前天气",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string", "description": "城市名称" }
      },
      "required": ["city"]
    }
  }
}

# anthropic的格式
{
  "name": "get_weather",
  "description": "查询指定城市的当前天气",
  "input_schema": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "城市名称" }
    },
    "required": ["city"]
  }
}

```

同一套工具在`openai` 这里能用，但是你拿到`anthropic`就要改一遍，这样对于用户来说很麻烦。

这个和当年手机充电线的混乱是一样的，每个手机厂商有自己一套充电协议，自家手机只能使用自家的充电线，从用户的角度看非常的不方便。

Anthropic推出了MCP( Model Context Protocol ), 可以认为是AI领域的【USB-C标准】，按照MCP的规范写一套工具，只要支持MCP的AI工具
都能接入，这样就不用关心底层是哪家模型。

使用Python的fastmcp协议个工具仅需几行代码：

```python 
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather-server")

@mcp.tool()
def get_weather(city: str) -> str:
  """ 查询指定城市的天气 """
  return f"{city}:35℃ ，晴"

mcp.run()
```

MCP已经是行业标准了，但请注意它不是什么AI新能力，只是把怎么描述工具，怎么调用工具标准了。底层还是Tool那一套：
模型决定什么时候调用工具，外围工具执行调用工具，把执行结果返回给模型。

## Agent: 给LLM加上循环

有了Tool， LLM就有了执行能力，但如果只是【用户提问--模型调用一次工具--返回结果】这种一次性问答的话，能做的事情非常有限。

一个任务往往需要多个步骤，比如写代码： 先读一下文件看看历史逻辑，再修改，测试一下看执行结果，确认是否正确。

Agent的思路： LLM+ Tool Use 放到一个循环里面.

伪代码：

```bash
while 未完成：
  模型思考下一步改做什么
  if 模型认为调用工具：
    执行工具，把结果追加到上下文
  else if 模型认为完成：
     结束循环，输出最终结果
```

Claude ,Codex 这种编程Agent本质就是这个循环，配置上相关的工具： 读文件，写文件，执行命令，搜索代码、运行测试。

模型在循环中不断地 思考--行动--观察结果--再思考。

所以 Agent并不神秘，它的【智能】来自两部分： 模型本身的推理能力决定了它是否能想出正确的下一步，工具赋予了它实现想法的能力。

LLM是大脑，工具是手和脚，循环是驱动力，结合起来就是Agent。

## Skills：可复用的工作流程

有了LLM和工具，Agent知道自己能做什么，但是面对一个非常复杂的问题，它还要知道【该怎么做】，也就是工作流程。

这个就是Skills需要解决的问题。

虽然模型有自主解决问题的能力，你给他一个问题，它能自己想怎么做，但是可能不稳定，每次执行的方式可能不一样。

Skills把一套完整的操作流程写成了文档，Agent照着一步步执行即可。

Anthropic官方的PDF Skill举例，结构如下：

```bash
skills/pdf/
├── SKILL.md        # 核心文件：何时触发 + 操作指南
├── reference.md    # 详细参考文档
├── forms.md        # 表单填写专项指南
└── scripts/        # 预写好的 Python 脚本
```

其中最核心的文件是 `SKILL.md`,它告诉LLM什么时候调用这个Skill。

```bash
---
name: pdf
description: Use this skill whenever the user wants to do
  anything with PDF files. This includes reading or extracting
  text/tables from PDFs, combining or merging multiple PDFs,
  splitting PDFs apart, rotating pages, adding watermarks,
  creating new PDFs, filling PDF forms...
---
```

正文部分是操作指南，每个脚本的用法，怎么读取PDF。怎么合并、怎么提取表格、甚至连代码示例都写好了。
`scripts/`目录下放一些已经写好的Python脚本。

```bash
scripts/
├── extract_form_field_info.py    # 提取表单字段信息
├── fill_fillable_fields.py       # 填写表单字段
├── convert_pdf_to_images.py      # PDF 转图片
|...
```

当Agent读到`SKILL.md`，就知道具体怎么操作了 ，它不需要自己写脚本，也不需要加载脚本到上下文去【理解】，它只要知道怎么调用即可。

这样做的好处很明显，Agent的读一下 `SKILL.md`，借助写好的工具就能完成任务了。

大模型在加载Skills有一个巧妙的设计： 渐进式披露（Progressive Disclosure）， 一个完整的`PDF Skill`token量会很庞大，
如果一下子加载太多，就会非常的浪费Token。 启动的时候只是先加载简介，让大模型知道这个Skill是干啥的，当真正要调用这个Skill才会
加载正文。

按需加载，大幅度节省Token。

## RAG 

## 自动记忆

## Harness  

## 总结

