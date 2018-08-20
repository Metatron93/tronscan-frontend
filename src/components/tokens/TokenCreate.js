import React, {Component, Fragment} from 'react';
import {t, tu} from "../../utils/i18n";
import {Client} from "../../services/api";
import {connect} from "react-redux";
import {loadTokens} from "../../actions/tokens";
import {login} from "../../actions/app";
import {TextField} from "../../utils/formHelper";
import {filter, trim, some, sumBy} from "lodash";
import {ASSET_ISSUE_COST, ONE_TRX} from "../../constants";
import {FormattedNumber, FormattedDate, injectIntl} from "react-intl";
import {Alert} from "reactstrap";
import {addDays, addHours, isAfter} from "date-fns";
import "react-datetime/css/react-datetime.css";
import DateTimePicker from "react-datetime";
import {Link} from "react-router-dom";
import {NumberField} from "../common/Fields";
import SweetAlert from "react-bootstrap-sweetalert";
import 'moment/min/locales';
import {pkToAddress} from "@tronscan/client/src/utils/crypto";
import {NavLink, Route, Switch} from "react-router-dom";
import BasicInfo from "./BasicInfo.js"


class TokenCreate extends Component {

  constructor() {
    super();

    let startTime = new Date();
    startTime.setHours(0, 0, 0, 0);

    let endTime = new Date();
    endTime.setHours(0, 0, 0, 0);
    endTime.setDate(startTime.getDate() + 90);

    this.state = {
      privateKey: "",
      name: "",
      abbr: "",
      totalSupply: 100000,
      numberOfCoins: 1,
      numberOfTron: 1,
      startTime: startTime,
      endTime: endTime,
      description: "",
      url: "http://",
      confirmed: false,
      loading: false,
      isTokenCreated: false,
      minimumDate: Date.now,
      issuedAsset: null,
      errors: {
        name: null,
        supply: null,
        description: null,
        url: null,
        tronAmount: null,
        tokenAmount: null,
        startDate: null,
        endDate: null,
        abbr: null,
      },

      valid: false,
      submitMessage: null,
      frozenSupply: [],
    };
  }

  hideModal = () => {
    this.setState({
      modal: null,
    });
  };
  preSubmit = () => {
    let {intl} = this.props;
    let {privateKey} = this.state;
    this.setState({
      modal: (
          <SweetAlert
              info
              showCancel
              confirmBtnText={intl.formatMessage({id: 'confirm'})}
              confirmBtnBsStyle="success"
              cancelBtnText={intl.formatMessage({id: 'cancel'})}
              cancelBtnBsStyle="default"
              title={intl.formatMessage({id: 'confirm_token_issue'})}
              onConfirm={this.submit}
              onCancel={this.hideModal}
              style={{marginLeft: '-240px', marginTop: '-195px'}}
          >
            <div style={{overflow: 'auto'}}>
              <table className="table m-0 text-left">
                <tbody>
                <tr>
                  <th>{tu('token_name')}:</th>
                  <td>{trim(this.state.name)}</td>
                </tr>
                <tr>
                  <th>{tu('total_supply')}:</th>
                  <td><FormattedNumber value={this.state.totalSupply}/></td>
                </tr>
                <tr>
                  <th>{tu('website_url')}:</th>
                  <td>{this.state.url}</td>
                </tr>
                <tr>
                  <th>{tu('exchange_rate')}:</th>
                  <td>{this.state.numberOfCoins + ' : ' + this.state.numberOfTron}</td>
                </tr>
                <tr>
                  <th>{tu('participation')}:</th>
                  <td>
                    <FormattedDate value={this.state.startTime.getTime()}/>
                    {' '}{tu('_to')}{' '}
                    <FormattedDate value={this.state.endTime.getTime()}/>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </SweetAlert>)
    });
  }

  submit = async () => {
    let {account} = this.props;
    let {privateKey} =this.state;

    this.setState({modal: null, loading: true, submitMessage: null});

    try {
      let {success} = await Client.createToken({
        address: account.address,
        name: trim(this.state.name),
        shortName: trim(this.state.abbr),
        totalSupply: this.state.totalSupply,
        num: this.state.numberOfCoins,
        trxNum: this.state.numberOfTron * ONE_TRX,
        startTime: this.state.startTime,
        endTime: this.state.endTime,
        description: this.state.description,
        url: this.state.url,
        frozenSupply: filter(this.state.frozenSupply, fs => fs.amount > 0),
      })(account.key);

      if (success) {
        this.setState({
          isTokenCreated: true,
        });
      } else {
        this.setState({
          submitMessage: (
              <Alert color="warning" className="text-center">
                {tu("token_creation_error")}
              </Alert>
          )
        });
      }

    } finally {
      this.setState({loading: false});
    }
  };

  isValid = () => {

    let {loading, name, abbr, totalSupply, numberOfCoins, numberOfTron, startTime, endTime, description, url, confirmed} = this.state;


    let newErrors = {
      name: null,
      supply: null,
      description: null,
      url: null,
      tronAmount: null,
      tokenAmount: null,
      startDate: null,
      endDate: null,
    };

    if (loading) {
      return {
        errors: newErrors,
        valid: false,
      };
    }

    if (confirmed) {

      name = trim(name);

      if (name.length === 0) {
        newErrors.name = tu("no_name_error");
      } else if (name.length > 32) {
        newErrors.name = tu("tokenname_error_message_0");
      } else if (!/^[a-zA-Z]+$/i.test(name)) {
        newErrors.name = tu("tokenname_error_message_1");
      }

      abbr = trim(abbr);

      if (abbr.length === 0) {
        newErrors.abbr = tu("abbreviation_required");
      } else if (abbr.length > 5) {
        newErrors.abbr = tu("abbreviation_error_message_0");
      } else if (!/^[a-zA-Z]+$/i.test(abbr)) {
        newErrors.abbr = tu("abbreviation_error_message_1");
      }

      if (description.length === 0) {
        newErrors.description = tu("no_description_error");
      } else if (description.length > 200) {
        newErrors.description = tu("description_error_message_0");
      }
    }

    if (totalSupply <= 0)
      newErrors.supply = tu("no_supply_error");

    if (url.length === 0)
      newErrors.url = tu("no_url_error");

    if (numberOfTron <= 0)
      newErrors.tronAmount = tu("tron_value_error");

    if (numberOfCoins <= 0)
      newErrors.tokenAmount = tu("coin_value_error");

    if (!startTime)
      newErrors.startDate = tu("invalid_starttime_error");

    let calculatedStartTime = new Date(startTime).getTime();

    if (calculatedStartTime < Date.now())
      newErrors.startDate = tu("past_starttime_error");

    if (!endTime)
      newErrors.endDate = tu("invalid_endtime_error");

    if (new Date(endTime).getTime() <= calculatedStartTime)
      newErrors.endDate = tu("date_error");

    return {
      errors: newErrors,
      valid: confirmed === true && !some(Object.values(newErrors), error => error !== null),
    };
  };

  isLoggedIn = () => {
    let {account} = this.props;
    return account.isLoggedIn;
  };

  componentDidMount() {
    this.setStartTime();
    this.checkExistingToken();
  }

  checkExistingToken = () => {

    let {wallet} = this.props;

    if (wallet !== null) {
      Client.getIssuedAsset(wallet.address).then(({token}) => {
        if (token) {
          this.setState({
            issuedAsset: token,
          });
        }
      });
    }
  };

  setStartTime = async () => {
    let block = await Client.getLatestBlock();

    let startTime = addDays(new Date(block.timestamp), 1);
    let minimumTime = addHours(new Date(block.timestamp), 1);

    this.setState({
      startTime,
      minimumTime,
    });
  };

  isValidStartTime = (current, selectedDate) => {
    let {minimumTime} = this.state;
    return isAfter(current, minimumTime);
  };

  isValidEndTime = (current, selectedDate) => {
    let {startTime} = this.state;
    return isAfter(current, startTime);
  };

  componentDidUpdate(prevProps, prevState) {
    let {frozenSupply} = this.state;

    if (frozenSupply.length === 0) {
      this.setState({
        frozenSupply: [
          {
            amount: 0,
            days: 1,
          }
        ]
      });
    } else if (frozenSupply.length > 0) {

      let emptyFields = this.getEmptyFrozenFields();

      if (emptyFields.length === 0) {
        this.setState({
          frozenSupply: [
            ...frozenSupply,
            {
              amount: 0,
              days: 1,
            }
          ]
        });
      }
    }

    let newState = {};
    let hasChange = false;

    for (let field of Object.keys(this.state)) {
      let value = this.state[field];
      if (value !== prevState[field]) {
        hasChange = true;
        switch (field) {
          case "num":
            value = value > 1 || value === "" ? value : 1;
            break;
          case "trxNum":
            value = value > 1 || value === "" ? value : 1;
            break;
          case "totalSupply":
            value = value > 1 || value === "" ? value : 1;
            break;
        }
      }
      newState[field] = value;
    }

    if (hasChange) {
      this.setState(newState);
    }
  }

  getEmptyFrozenFields = () => {
    let {frozenSupply} = this.state;
    return filter(frozenSupply, fs => Math.round(parseInt(fs.amount)) === 0 || fs.amount === "");
  };

  renderSubmit = () => {
    let {isTokenCreated, privateKey} = this.state;
    let {account} = this.props;

    let isPrivateKeyValid = privateKey && privateKey.length === 64 && pkToAddress(privateKey)===account.address;
    let {valid} = this.isValid();

    let {wallet} = this.props;

    if (isTokenCreated) {
      return (
          <Alert color="success" className="text-center">
            {tu("token_issued_successfully")}<br/>
            {tu("token_link_message_0")}{' '}
            <Link to="/tokens/list">{tu("token_link_message_1")}</Link>{' '}
            {tu("token_link_message_2")}
          </Alert>
      );
    }

    if (!wallet) {
      return (
          <Alert color="warning" className="text-center">
            {tu("trx_token_wallet_requirement")}
          </Alert>

      );
    }

    if (wallet.balance < ASSET_ISSUE_COST) {
      return (
          <Alert color="danger" className="text-center">
            {tu("trx_token_fee_message")}
          </Alert>
      );
    }


    return (
        <Fragment>

          <div className="text-center">
            <button
                disabled={!valid}
                type="button"
                className="btn btn-success"
                onClick={this.preSubmit}>{tu("issue_token")}</button>
          </div>
        </Fragment>
    );
  };

  updateFrozen(index, values) {

    let {frozenSupply} = this.state;

    frozenSupply[index] = {
      ...frozenSupply[index],
      ...values
    };

    for (let frozen of frozenSupply) {

      if (trim(frozen.amount) !== "")
        frozen.amount = parseInt(frozen.amount);

      if (trim(frozen.days) !== "")
        frozen.days = parseInt(frozen.days);

      frozen.amount = frozen.amount > 0 || frozen.amount === "" ? frozen.amount : 0;
      frozen.days = frozen.days > 0 || frozen.days === "" ? frozen.days : 1;
    }

    this.setState({
      frozenSupply,
    });
  }

  blurFrozen(index) {
    let {frozenSupply} = this.state;

    let isEmpty = frozenSupply[index].amount <= 0 || frozenSupply[index].amount === "";

    if (isEmpty && this.getEmptyFrozenFields().length >= 2) {
      frozenSupply.splice(index, 1);
    }

    this.setState({
      frozenSupply,
    });
  }

  render() {
    let {modal, numberOfCoins, numberOfTron, name, submitMessage, frozenSupply, url, confirmed, loading, issuedAsset, totalSupply, startTime, endTime} = this.state;
    let {match} = this.props;

    if (!this.isLoggedIn()) {
      return (
          <main className="container pb-3 token-create header-overlap">
            <div className="row">
              <div className="col-sm-12">
                <div className="card">
                  <div className="card-body">
                    <div className="text-center p-3">
                      {tu("not_signed_in")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
      );
    }
    if (issuedAsset !== null) {
      return (
          <main className="container pb-3 token-create header-overlap">
            <div className="row">
              <div className="col-sm-8">
                <div className="card">
                  <div className="card-body">
                    <div className="text-center p-3">
                      {tu("trx_token_account_limit")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
      );
    }

    let {valid, errors} = this.isValid();

    let exchangeRate = numberOfTron / numberOfCoins;
    let {activeLanguage, language} = this.props;

    if (activeLanguage === "en") {
      language = 'en-gb';
    } else if (activeLanguage === "no") {
      language = 'en-gb';
    } else if (activeLanguage === "zh") {
      language = 'zh-cn';
    } else {
      language = activeLanguage;
    }

    if (!loading && confirmed && !valid) {
      submitMessage = (
          <Alert color="warning" className="text-center">
            {tu("errors_in_form")}
          </Alert>
      );
    }

    return (

        <main className="container pb-3 token-create header-overlap">
          {modal}
          <div className="row">
            <div className="col-sm-12 col-md-3 mt-3 mt-md-0">
              <div className="card">
                <div className="card-body">
                  <div className="ant-steps ant-steps-vertical">
                    <div className="ant-steps-item ant-steps-item-process">
                      <div className="ant-steps-item-tail"></div>
                      <div className="ant-steps-item-icon"><span className="ant-steps-icon">1</span></div>
                      <div className="ant-steps-item-content">
                        <div className="ant-steps-item-title">基本信息</div>
                        <div className="ant-steps-item-description">通证的基本信息</div>
                      </div>
                    </div>
                    <div className="ant-steps-item ant-steps-item-wait">
                      <div className="ant-steps-item-tail"></div>
                      <div className="ant-steps-item-icon"><span className="ant-steps-icon">2</span></div>
                      <div className="ant-steps-item-content">
                        <div className="ant-steps-item-title">汇率设置</div>
                        <div className="ant-steps-item-description">规定每个通证的价格</div>
                      </div>
                    </div>
                    <div className="ant-steps-item ant-steps-item-wait">
                      <div className="ant-steps-item-tail"></div>
                      <div className="ant-steps-item-icon"><span className="ant-steps-icon">3</span></div>
                      <div className="ant-steps-item-content">
                        <div className="ant-steps-item-title">锁仓设置</div>
                        <div className="ant-steps-item-description">可锁定部分通证固定时间</div>
                      </div>
                    </div>
                    <div className="ant-steps-item ant-steps-item-wait">
                      <div className="ant-steps-item-tail"></div>
                      <div className="ant-steps-item-icon"><span className="ant-steps-icon">4</span></div>
                      <div className="ant-steps-item-content">
                        <div className="ant-steps-item-title">确认设置</div>
                        <div className="ant-steps-item-description">确认全部信息</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-12 col-md-9">
              <div className="card">
                <div className="card-body">


                    <Switch>
                      {
                        <Route exact path={match.url + ''} render={() => (<BasicInfo/>)}/>

                      }
                    </Switch>


                </div>
              </div>
            </div>
          </div>
        </main>
    )
  }
}

function mapStateToProps(state) {
  return {
    activeLanguage: state.app.activeLanguage,
    tokens: state.tokens.tokens,
    account: state.app.account,
    wallet: state.wallet.current,
  };
}

const mapDispatchToProps = {
  login,
  loadTokens,
};

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(TokenCreate));
