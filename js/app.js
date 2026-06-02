const map = new maplibregl.Map({
container: 'map',
style: 'https://demotiles.maplibre.org/style.json',
center: [137.0,36.0],
zoom: 4.5
});

let fireData=[];

fetch("data/fire_history.json")
.then(res=>res.json())
.then(data=>{
fireData=data;
render(data);
updateStats(data);
});

function render(data){

document.querySelectorAll(".marker")
.forEach(e=>e.remove());

data.forEach(item=>{

const color =
item.type==="forest"
? "green"
: "red";

const el=document.createElement("div");

el.className="marker";

el.style.width="16px";
el.style.height="16px";
el.style.borderRadius="50%";
el.style.background=color;

new maplibregl.Marker(el)
.setLngLat([item.lng,item.lat])
.setPopup(
new maplibregl.Popup()
.setHTML(`
<h3>${item.name}</h3>
<p>${item.date}</p>
<p>${item.prefecture}</p>
<p>${item.damage_area}</p>
<p>${item.summary}</p>
<a href="${item.source}" target="_blank">引用元</a>
`)
)
.addTo(map);

});

}

function updateStats(data){

const forest=
data.filter(x=>x.type==="forest").length;

const temple=
data.filter(x=>x.type==="temple").length;

document.getElementById("stats").innerHTML=
`
森林火災:${forest}件
｜
神社仏閣火災:${temple}件
｜
総数:${data.length}件
`;
}

document.getElementById("searchBtn")
.addEventListener("click",()=>{

const type=
document.getElementById("typeFilter").value;

const start=
document.getElementById("startDate").value;

const end=
document.getElementById("endDate").value;

let result=fireData;

if(type!=="all"){
result=result.filter(x=>x.type===type);
}

if(start){
result=result.filter(x=>x.date>=start);
}

if(end){
result=result.filter(x=>x.date<=end);
}

render(result);
updateStats(result);

});