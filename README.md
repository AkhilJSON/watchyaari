# WatchYaari - Watch videos together with your friends

Platform where users can watch youtube videos while on a video chat. Basically a digital party where users can enjoy watching videos together.
Separated by distance, brought together by WatchYaari.


<img width="1440" alt="Screenshot 2022-08-24 at 9 53 28 PM" src="https://user-images.githubusercontent.com/26838762/186484922-de0fcb3c-6f29-4b10-9417-8068ad4d4805.png">
<img width="1440" alt="Screenshot 2022-08-24 at 10 00 39 PM" src="https://user-images.githubusercontent.com/26838762/186473611-184617fe-01d8-48cf-b6f2-6c9b2a83ec17.png">
<img width="1440" alt="Screenshot 2022-08-24 at 10 01 06 PM" src="https://user-images.githubusercontent.com/26838762/186485907-9caf871b-40ad-4f19-9642-13545d0bb428.png">
<img width="1440" alt="Screenshot 2022-08-24 at 10 00 23 PM" src="https://user-images.githubusercontent.com/26838762/186484722-109020aa-fc22-4e4a-8f6e-f0a127599907.png">
<img width="1440" alt="Screenshot 2022-08-24 at 10 00 51 PM" src="https://user-images.githubusercontent.com/26838762/186484785-19041544-ca3d-473c-8126-89da5f1f96c7.png">
<img width="1315" alt="Screenshot 2022-08-24 at 9 52 19 PM" src="https://user-images.githubusercontent.com/26838762/186486192-0e5bcbce-7c6b-45f9-b115-c02cd0559b80.png">
<img width="1440" alt="Screenshot 2022-08-24 at 10 01 28 PM" src="https://user-images.githubusercontent.com/26838762/186486403-ed2edb93-5e0e-48a5-bd37-8d8a7815e12e.png">
<img width="1440" alt="Screenshot 2022-08-28 at 9 22 02 AM" src="https://user-images.githubusercontent.com/26838762/187056564-db66a18e-4010-416a-a989-34838c8f337f.png">




# Overview video (Optional)

Here's a short video that explains the project and how it uses Redis:


[![Embed your YouTube video](https://user-images.githubusercontent.com/26838762/186484887-8f5361ba-e309-49bb-af05-f82a28a977e6.png)](https://www.youtube.com/watch?v=h9V-9zfZmUc)

## How it works

### How the data is stored:

Used RedisJSON for saving JSON data in Redis with the help of redis-om nodejs library.

<img width="1440" alt="Screenshot 2022-08-28 at 4 18 35 PM" src="https://user-images.githubusercontent.com/26838762/187070194-aa559fca-2b5a-4f0f-9b17-f938fab5905c.png">

<img width="1440" alt="Screenshot 2022-08-28 at 4 20 22 PM" src="https://user-images.githubusercontent.com/26838762/187070287-4ec7631a-b45f-4458-97fb-83b4fd8b82b0.png">



### How the data is accessed:

Used RedisSearch to query data stored in Redis with the help of redis-om nodejs library.

<img width="1440" alt="Screenshot 2022-08-28 at 4 27 31 PM" src="https://user-images.githubusercontent.com/26838762/187070624-7c080a65-ef2d-4037-9b12-5c3677d0dcce.png">

<img width="1440" alt="Screenshot 2022-08-28 at 4 24 48 PM" src="https://user-images.githubusercontent.com/26838762/187070556-68fcb458-ebc4-4675-93bd-4d628296a4b8.png">


### Keys changes while moving from MongoDB to Redis as primary database 
- Changed MongoDB ObjectId dependecies to RedisJSON entityId
- Changed Mongoose models to RedisJSON schema

  Mongoose Model
  <img width="1440" alt="Screenshot 2022-08-27 at 10 33 17 PM" src="https://user-images.githubusercontent.com/26838762/187040521-d42cf882-d0fb-4729-a00b-96736bb69600.png">  
  
  RedisJSON Schema
  <img width="1440" alt="Screenshot 2022-08-27 at 10 32 48 PM" src="https://user-images.githubusercontent.com/26838762/187040537-949b1428-c926-4934-9cc7-e71038298b30.png">

- Changed queries
    
  Mongoose aggregate query  
  <img width="710" alt="Screenshot 2022-08-27 at 10 39 26 PM" src="https://user-images.githubusercontent.com/26838762/187040727-acaf900d-f177-45db-bec2-405e54346522.png">

  RedisSearch query  
  <img width="660" alt="Screenshot 2022-08-27 at 10 40 16 PM" src="https://user-images.githubusercontent.com/26838762/187040751-ba176261-be22-4490-848e-64d4662895d5.png">


### Architecture diagram 
![WatchYaariBeforeAfterRedisHacathon drawio](https://user-images.githubusercontent.com/26838762/186468420-7d427406-71a4-4df9-a8db-624701e62a3f.png)

## How to run it locally?

### Prerequisites
- Node - v14.16.0
- Angular: 9.1.9
- Angular CLI: 9.1.4
- NPM - v8.3.0
- Redisstack server

- **Not in scope**
  - Coturn server - Free open source implementation of TURN and STUN server in case if peer-to-peer connection between clients is not established. 

### Local installation

- Navigate inside **/client** & run **npm i** to install dependencies.
- Run **ng serv**e inside **/client** to run the Client App.
- Check if Client app is up & running by accessing http://localhost:4200, You should be able to see app home page.
- Install nodemon globally for running nodejs server - **npm i -g nodemon**.
- Navigate inside **/server** & run **npm i** to install dependencies.
- Run **nodemon** inside **/server** to run the Express.js server.
- Check if Server app is up & running by accessing http://localhost:3000, You should see **All set!.** response.
- Run the [GET] http://localhost:3000/common/restoreData API from browser/curl/postman to restore necessary data into RedisJSON.


## More Information about Redis Stack

Here some resources to help you quickly get started using Redis Stack. If you still have questions, feel free to ask them in the [Redis Discord](https://discord.gg/redis) or on [Twitter](https://twitter.com/redisinc).

### Getting Started

1. Sign up for a [free Redis Cloud account using this link](https://redis.info/try-free-dev-to) and use the [Redis Stack database in the cloud](https://developer.redis.com/create/rediscloud).
1. Based on the language/framework you want to use, you will find the following client libraries:
    - [Redis OM .NET (C#)](https://github.com/redis/redis-om-dotnet)
        - Watch this [getting started video](https://www.youtube.com/watch?v=ZHPXKrJCYNA)
        - Follow this [getting started guide](https://redis.io/docs/stack/get-started/tutorials/stack-dotnet/)
    - [Redis OM Node (JS)](https://github.com/redis/redis-om-node)
        - Watch this [getting started video](https://www.youtube.com/watch?v=KUfufrwpBkM)
        - Follow this [getting started guide](https://redis.io/docs/stack/get-started/tutorials/stack-node/)
    - [Redis OM Python](https://github.com/redis/redis-om-python)
        - Watch this [getting started video](https://www.youtube.com/watch?v=PPT1FElAS84)
        - Follow this [getting started guide](https://redis.io/docs/stack/get-started/tutorials/stack-python/)
    - [Redis OM Spring (Java)](https://github.com/redis/redis-om-spring)
        - Watch this [getting started video](https://www.youtube.com/watch?v=YhQX8pHy3hk)
        - Follow this [getting started guide](https://redis.io/docs/stack/get-started/tutorials/stack-spring/)

The above videos and guides should be enough to get you started in your desired language/framework. From there you can expand and develop your app. Use the resources below to help guide you further:

1. [Developer Hub](https://redis.info/devhub) - The main developer page for Redis, where you can find information on building using Redis with sample projects, guides, and tutorials.
1. [Redis Stack getting started page](https://redis.io/docs/stack/) - Lists all the Redis Stack features. From there you can find relevant docs and tutorials for all the capabilities of Redis Stack.
1. [Redis Rediscover](https://redis.com/rediscover/) - Provides use-cases for Redis as well as real-world examples and educational material
1. [RedisInsight - Desktop GUI tool](https://redis.info/redisinsight) - Use this to connect to Redis to visually see the data. It also has a CLI inside it that lets you send Redis CLI commands. It also has a profiler so you can see commands that are run on your Redis instance in real-time
1. Youtube Videos
    - [Official Redis Youtube channel](https://redis.info/youtube)
    - [Redis Stack videos](https://www.youtube.com/watch?v=LaiQFZ5bXaM&list=PL83Wfqi-zYZFIQyTMUU6X7rPW2kVV-Ppb) - Help you get started modeling data, using Redis OM, and exploring Redis Stack
    - [Redis Stack Real-Time Stock App](https://www.youtube.com/watch?v=mUNFvyrsl8Q) from Ahmad Bazzi
    - [Build a Fullstack Next.js app](https://www.youtube.com/watch?v=DOIWQddRD5M) with Fireship.io
    - [Microservices with Redis Course](https://www.youtube.com/watch?v=Cy9fAvsXGZA) by Scalable Scripts on freeCodeCamp
