var posts=["2025/09/11/hello-world/","2025/07/30/科目一/","2025/08/20/科目二/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };