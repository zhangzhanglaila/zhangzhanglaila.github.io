var posts=["2025/07/30/科目一/","2025/09/11/hello-world/","2025/08/20/科目二/","2025/10/02/算法2-1 在顺序表 list 中查找元素 x/","2025/10/02/算法2-2 在顺序表 list 的第 i 个位置上插入元素 x/","2025/04/20/网络工程与科学导论/","2025/10/02/算法2-3 从顺序表 list 中删除第 i 个元素/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };