//import puppeteer from 'puppeteer';
const puppeteer = require('puppeteer');
// Or import puppeteer from 'puppeteer-core';

async function getTime(browser, link, name){
    const page = await browser.newPage();
    await page.goto(link);

    await page.waitForNetworkIdle('networkidle')

    const timeText = await page.evaluate(()=>{
        return document.querySelectorAll("h1>span>span")[0].innerText;
    })
    const distanceText = await page.evaluate(()=>{
        return document.querySelectorAll("h1>span>span")[1].innerText;
    })

    await page.close();
    return { timeText, distanceText, name, date: new Date(), type: "traffic" };
}

async function readResult(jobs, promise){
    const res = await promise;
    switch (res.type) {
        case "traffic":
            jobs.traffic[res.name].timeText = res.timeText;
            jobs.traffic[res.name].distanceText = res.distanceText;
            jobs.traffic[res.name].date = res.date;
            break;
    
        default:
            console.log("Unknow type " + res.type);
            break;
    }
}

async function start(){
    const jobs = {
        traffic: {
            states: {
                link: 'https://www.google.fr/maps/dir/40.7473526,-73.9881735/40.7380187,-74.0657034/@40.7475703,-74.0679124,13z/am=t/data=!3m1!4b1!4m4!4m3!1m0!1m1!4e1?entry=ttu'
            },
            france: {
                link: 'https://www.google.fr/maps/dir/48.8786503,2.2809127/48.9007221,2.3499238/@48.8863605,2.2308947,12z/am=t/data=!3m1!4b1!4m4!4m3!1m0!1m1!4e1?entry=tts&g_ep=EgoyMDI0MDcxNC4wKgBIAVAD'
            },
            italy: {
                link: 'https://www.google.fr/maps/dir/41.8933589,12.5165281/41.8805506,12.5079404/@41.8870089,12.5070753,16z/am=t/data=!3m1!4b1!4m4!4m3!1m0!1m1!4e1?entry=ttu'
            }
        }
    }

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({headless: process.env.HEADLESS === undefined ? false: true});//{headless: false}

    // Traffic
    const trafficList = Object.keys(jobs.traffic);
    if(trafficList.length !== 0){
        try {
            const page = await browser.newPage();
    
            // Navigate the page to a URL.
            await page.goto(jobs.traffic[trafficList[0]].link);
            await page.evaluate(()=>{
                document.querySelectorAll("form")[1].submit();
            })
            await page.waitForNetworkIdle('networkidle')
            await page.close();
        } catch (error) {
        }

        const researchList = [];

        for (let index = 0; index < trafficList.length; index++) {
            if(researchList.length>=5) {
                await readResult(jobs, researchList[0]);
                researchList.splice(0, 1);
            }
            const link = jobs.traffic[trafficList[index]];
            researchList.push(getTime(browser, link.link, trafficList[index]));
        }

        for (const research of researchList) {
            await readResult(jobs, research);
        }
        researchList.splice(0, researchList.length);
    }

    await browser.close();

    for (const location of trafficList) {
        const data = jobs.traffic[location];
        console.log(`Location ${location} (${data.date.getDate()}/${data.date.getMonth()} ${data.date.getHours()}:${data.date.getMinutes()}) : ${data.timeText} ${data.distanceText}`);
    }
}

start()