import React from 'react';
import {connect} from 'react-redux';
import './../assets/scss/main.scss';

import {GLOBAL_CONFIG} from '../config/config.js';
import * as I18n from '../vendors/I18n.js';
import * as SAMPLES from '../config/samples.js';

import SCORM from './SCORM.jsx';
import Header from './Header.jsx';
import FinishScreen from './FinishScreen.jsx';
import Quiz from './Quiz.jsx';
import xmlToJson from 'moodlexml-to-json';

export class App extends React.Component {
  constructor(props){
    super(props);
    I18n.init();
    this.state = {
      quiz:SAMPLES.quiz_example,
      loading:true,
    };

    this.parseMoodleXML = this.parseMoodleXML.bind(this);
  }
  render(){
    let appHeader = "";
    let appContent = "";

    if(((this.props.tracking.finished !== true) || (GLOBAL_CONFIG.finish_screen === false)) && !this.state.loading){
      appHeader = (
        <Header user_profile={this.props.user_profile} tracking={this.props.tracking} config={GLOBAL_CONFIG} I18n={I18n}/>
      );
      if(this.props.wait_for_user_profile !== true && !this.state.loading){
        appContent = (
          <Quiz dispatch={this.props.dispatch} user_profile={this.props.user_profile} tracking={this.props.tracking} quiz={this.state.quiz} config={GLOBAL_CONFIG} I18n={I18n}/>
        );
      }
    } else if(!this.state.loading){
      const success_status = this.props.tracking.score >= GLOBAL_CONFIG.scorm.score_threshold;
      appContent = (
        <FinishScreen success_status={success_status} finishCallback={GLOBAL_CONFIG.finishCallback} msg={success_status ? GLOBAL_CONFIG.successMessage : GLOBAL_CONFIG.failMessage} dispatch={this.props.dispatch} user_profile={this.props.user_profile} tracking={this.props.tracking} quiz={this.state.quiz} config={GLOBAL_CONFIG} I18n={I18n}/>
      );
    } else {
      appContent = <div className="wholeScreen loading">
        {I18n.getTrans("i.loading")}...
      </div>;
    }
    return (
      <div id="container" >
        <SCORM dispatch={this.props.dispatch} tracking={this.props.tracking} config={GLOBAL_CONFIG}/>
        {appHeader}
        <div className="container">
          {appContent}
        </div>
      </div>
    );
  }

  parseMoodleXML(xml){
    try {
      xmlToJson(xml.replace(/[\n]/mg, " "), (r, e)=>{
        let questions = [];
        for(let q in r.questions){
          let question = r.questions[q];
          switch (question.type){
          case 'multichoice':
            questions.push({type:'multiple_choice', format: question.format, value:question.questiontext, choices:(question.answers || []).map((a, id)=>{return {id, value:a.text, answer:a.score,};}), single:question.single, shuffleanswers: question.shuffleanswers, penalty: question.penalty});
            break;
          case 'truefalse':
            questions.push({type:'true_false', format: question.format, single:true, value:question.questiontext, answer:(question.answers || []).filter(a=> a.score === 100).map(a=> a.text)[0], penalty: question.penalty});
            break;
          case 'numerical':
            questions.push({type:'numerical', format: question.format, value:question.questiontext, answer:(question.correctAnswer || []), tolerance:question.tolerance, penalty: question.penalty});
            break;
          case 'shortanswer':
            questions.push({type:'shortanswer', format: question.format, value:question.questiontext, answer:(question.answers || []).filter(a=> a.score === 100).map(a=>a.text), penalty: question.penalty});
            break;
          case 'essay':
            questions.push({type:'essay', format: question.format, value:question.questiontext, penalty: question.penalty});
            break;
          case 'matching':
            break;
          default:
            // console.error("Unsupported");
          }
        }
        
        this.setState({quiz:{title:"", questions}});
      });
    } catch (e) {
      this.setState({loading:false});
    }
  }
  decode(input){
    return decodeURIComponent(window.atob(input.slice(21)).split('').map(function(c){
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }
  componentDidMount(){
    if(GLOBAL_CONFIG.dev){
      if(GLOBAL_CONFIG.moodleXMLPath){
        this.parseMoodleXML(this.decode(GLOBAL_CONFIG.moodleXmlPath));
        this.setState({loading:false});
      } else {
        this.setState({loading:false});
      }

    } else {
      fetch(GLOBAL_CONFIG.moodleXMLPath || "assets/quiz.xml")
      .then(res => res.text())
      .then(res => {
        this.parseMoodleXML(res);
        this.setState({loading:false});

      })
      .catch(err=>{
        this.setState({loading:false});
      });
    }
  }

}


function mapStateToProps(state){
  return state;
}

export default connect(mapStateToProps)(App);