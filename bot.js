console.log("Bot starting up!");

const Twit = require("twit");
const config = require("./config");
const fs = require("fs");
const download = require("image-downloader");
const axios = require("axios");
const url = `https://api.unsplash.com/photos/random/?query=otter&client_id=${config.unsplash.access_key}`;
const img_path = "./images/current_otter.jpeg";

let T = new Twit(config.twitter);

async function tweetIt() {
  //Unsplash API request
  function unsplash_request() {
    const request = axios.get(url);

    return request;
  }

  //Get the image locally
  function downloadImg(img_url) {
    const options = {
      url: img_url,
      dest: img_path,
    };

    download
      .image(options)
      .then(({ filename }) => {
        console.log(`Saved to ${filename}`);
      })
      .catch((err) => console.error(err));
  }

  //Upload the image and then proceed to tweet it
  function processing(img_data) {
    const filename = "./images/current_otter.jpeg";
    const params = {
      encoding: "base64",
    };
    const b64 = fs.readFileSync(filename, params);

    T.post("media/upload", { media_data: b64 }, uploaded);

    function uploaded(err, upload_data, response) {
      let message =
        img_data.data.user.twitter_username &&
        img_data.data.user.instagram_username
          ? `Photo credits go to ${img_data.data.user.name}!
      Twitter: @${img_data.data.user.twitter_username}
      Instagram: ${img_data.data.user.instagram_username}`
          : !img_data.data.user.twitter_username &&
            img_data.data.user.instagram_username
          ? `Photo credits go to ${img_data.data.user.name}!
      Instagram: ${img_data.data.user.instagram_username}`
          : img_data.data.user.twitter_username &&
            !img_data.data.user.instagram_username
          ? `Photo credits go to ${img_data.data.user.name}!
      Twitter: @${img_data.data.user.twitter_username}`
          : `Photo credits go to ${img_data.data.user.name}!`;

      let id = upload_data.media_id_string;
      let tweet = {
        status: message,
        media_ids: [id],
      };
      console.log(img_data.data);
      T.post("statuses/update", tweet, tweeted);
    }

    function tweeted(err, data, response) {
      if (err) {
        console.log("Well shit that didnt work");
        console.error(err);
      } else {
        console.log("Omg IT WORKED");
      }
    }
  }
  const img_data = await unsplash_request();
  downloadImg(img_data.data.urls.regular);
  processing(img_data);
}

let dayInMiliseconds = 1000 * 60 * 60 * setInterval(tweetIt, dayInMiliseconds);

tweetIt();
setInterval(tweetIt, 1000 * 300);
