
const { response } = require("express");
const { get } = require("http");


function addToCart(proId){
    console.log(proId,"proId");
    $.ajax({
        url:'/add-to-cart/'+proId,   
        method:'get',
        success:(response=>{
            if(response.status){
                console.log(response)
                console.log("inside of toast");
                swal({
                    title: "Cart",
                    text: "Item success fully added!",
                    icon: "success",
                    button: "Ok",
                    Location:location.reload()
                  });
                
            }else if(response.exist){
                swal({
                    title: "Oops",
                    text: "Item has  already added !",
                    icon: "warning",
                    button: "Ok",
                  });
            }else{
                location.replace('/login')
            }
        })
    })
}
function addToWhishList(proId){
    console.log("entered the add to whishlist");
    $.ajax({
        url:'/add-to-wish/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                console.log(response);
                location.reload()
               
            }else{
                console.log("elseee");
                location.replace('/login')
            }
        }
    })
}

//pie chart
// Chart.defaults.global.elements.rectangle.backgroundColor = '#FF0000';

var bar_ctx = document.getElementById('bar-chart').getContext('2d');

var purple_orange_gradient = bar_ctx.createLinearGradient(0, 0, 0, 600);
purple_orange_gradient.addColorStop(0, 'orange');
purple_orange_gradient.addColorStop(1, 'purple');

var bar_chart = new Chart(bar_ctx, {
    type: 'bar',
    data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 8, 14, 5],
						backgroundColor: purple_orange_gradient,
						hoverBackgroundColor: purple_orange_gradient,
						hoverBorderWidth: 2,
						hoverBorderColor: 'purple'
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
});

